import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import { CurrentUserData } from '@/common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET', 'civicops-access-secret-change-in-production'),
    });
  }

  async validate(payload: { sub: string; tenantId: string }): Promise<CurrentUserData> {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, isActive: true },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        userScopes: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.name),
        ),
      ),
    ];

    const scope = this.buildScope(user.userScopes);

    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles,
      permissions,
      scope,
    };
  }

  private buildScope(userScopes: any[]) {
    if (!userScopes || userScopes.length === 0) {
      return { type: 'ASSIGNED_ONLY' };
    }

    const primaryScope = userScopes[0];
    return {
      type: primaryScope.scopeType,
      zoneIds: userScopes.filter((s) => s.zoneId).map((s) => s.zoneId),
      circleIds: userScopes.filter((s) => s.circleId).map((s) => s.circleId),
      wardIds: userScopes.filter((s) => s.wardId).map((s) => s.wardId),
      departmentIds: userScopes.filter((s) => s.departmentId).map((s) => s.departmentId),
    };
  }
}
