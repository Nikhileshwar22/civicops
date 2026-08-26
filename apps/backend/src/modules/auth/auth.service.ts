import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@/database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RedisService } from '@/infrastructure/redis/redis.service';

interface SessionContext {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private redisService: RedisService,
  ) {}

  async register(registerDto: RegisterDto, context: SessionContext) {
    const tenantId = registerDto.tenantId || await this.getDefaultTenantId();

    const existingUser = await this.prisma.user.findFirst({
      where: { email: registerDto.email, tenantId },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        tenantId,
      },
    });

    // Assign CITIZEN role
    const citizenRole = await this.prisma.role.findFirst({
      where: { name: 'CITIZEN', tenantId },
    });

    if (citizenRole) {
      await this.prisma.userRole.create({
        data: { userId: user.id, roleId: citizenRole.id },
      });
      // Give ASSIGNED_ONLY scope
      await this.prisma.userScope.create({
        data: { userId: user.id, scopeType: 'ASSIGNED_ONLY' },
      });
    }

    const tokens = await this.createSession(user.id, tenantId, context);

    this.eventEmitter.emit('auth.registered', {
      userId: user.id,
      tenantId,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId,
        roles: ['CITIZEN'],
        permissions: ['complaint:create', 'complaint:view', 'complaint:reopen', 'ai:use'],
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto, context: SessionContext) {
    const user = await this.prisma.user.findFirst({
      where: { email: loginDto.email, isActive: true },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        userRoles: {
          include: {
            role: { include: { rolePermissions: { include: { permission: true } } } },
          },
        },
        userScopes: {
          include: { zone: true, circle: true, ward: true, department: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.createSession(user.id, user.tenantId, context);

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.name),
        ),
      ),
    ];

    const scope = this.buildUserScope(user.userScopes);

    this.eventEmitter.emit('auth.login', {
      userId: user.id,
      tenantId: user.tenantId,
      ipAddress: context.ipAddress,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        tenantSlug: user.tenant.slug,
        roles,
        permissions,
        scope,
      },
      ...tokens,
    };
  }

  async getAuthenticatedUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        userRoles: {
          include: {
            role: { include: { rolePermissions: { include: { permission: true } } } },
          },
        },
        userScopes: {
          include: { zone: true, circle: true, ward: true, department: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.name),
        ),
      ),
    ];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
      tenantSlug: user.tenant.slug,
      roles,
      permissions,
      scope: this.buildUserScope(user.userScopes),
    };
  }

  async refreshToken(token: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const tokens = await this.generateTokens(storedToken.userId, storedToken.user.tenantId);

    // Store new refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: storedToken.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    await this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Invalidate user cache
    await this.redisService.del(`user:${userId}`);

    this.eventEmitter.emit('auth.logout', { userId });

    return { message: 'Logged out successfully' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, isActive: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a password reset link will be sent' };
    }

    // Generate reset token and store in Redis (expires in 1 hour)
    const resetToken = uuidv4();
    await this.redisService.set(
      `password-reset:${resetToken}`,
      JSON.stringify({ userId: user.id, email: user.email }),
      3600,
    );

    // Queue email (will be processed by email worker)
    this.eventEmitter.emit('auth.password_reset_requested', {
      userId: user.id,
      email: user.email,
      token: resetToken,
      tenantId: user.tenantId,
    });

    this.logger.log(`Password reset requested for ${email}`);
    return { message: 'If the email exists, a password reset link will be sent' };
  }

  async confirmPasswordReset(token: string, newPassword: string) {
    const data = await this.redisService.get(`password-reset:${token}`);
    if (!data) {
      throw new UnauthorizedException('Invalid or expired password reset token');
    }

    const { userId } = JSON.parse(data);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke all refresh tokens to force re-login
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    // Delete the reset token
    await this.redisService.del(`password-reset:${token}`);

    this.eventEmitter.emit('auth.password_reset_completed', { userId });

    return { message: 'Password reset successfully. Please login with your new password.' };
  }

  private async createSession(userId: string, tenantId: string, context: SessionContext) {
    await this.prisma.session.create({
      data: {
        userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const tokens = await this.generateTokens(userId, tenantId);

    await this.prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return tokens;
  }

  private async generateTokens(userId: string, tenantId: string) {
    const payload = { sub: userId, tenantId };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshToken = uuidv4();

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  private async getDefaultTenantId(): Promise<string> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!tenant) {
      throw new Error('No active tenant found. Please seed the database.');
    }
    return tenant.id;
  }

  private buildUserScope(userScopes: any[]) {
    if (!userScopes || userScopes.length === 0) {
      return { type: 'ASSIGNED_ONLY' };
    }

    const scope = userScopes[0];
    return {
      type: scope.scopeType,
      zoneIds: userScopes.filter((s) => s.zoneId).map((s) => s.zoneId),
      circleIds: userScopes.filter((s) => s.circleId).map((s) => s.circleId),
      wardIds: userScopes.filter((s) => s.wardId).map((s) => s.wardId),
      departmentIds: userScopes.filter((s) => s.departmentId).map((s) => s.departmentId),
    };
  }
}
