import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TenantsRepository } from './tenants.repository';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CurrentUserData } from '@/common/decorators/current-user.decorator';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly repository: TenantsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(filter: any) {
    return this.repository.findAll(filter);
  }

  async findOne(id: string) {
    const tenant = await this.repository.findById(id);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findCurrent(user: CurrentUserData) {
    return this.findOne(user.tenantId);
  }

  async getStats(user: CurrentUserData) {
    return this.repository.getStats(user.tenantId);
  }

  async create(dto: CreateTenantDto, user: CurrentUserData) {
    const existing = await this.repository.findBySlug(dto.slug);
    if (existing) throw new ConflictException('Tenant slug already exists');

    const tenant = await this.repository.create({
      name: dto.name,
      slug: dto.slug,
      domain: dto.domain,
      settings: dto.settings || {
        timezone: 'Asia/Kolkata',
        locale: 'en-IN',
        slaDefaults: { low: 72, medium: 48, high: 24, critical: 4 },
        features: { aiEnabled: true, webhooksEnabled: true, ragEnabled: false, mapEnabled: true },
      },
    });

    this.eventEmitter.emit('tenant.created', { tenantId: tenant.id, createdBy: user.id });
    this.logger.log(`Tenant ${tenant.name} created`);
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto, user: CurrentUserData) {
    const tenant = await this.findOne(id);

    const updated = await this.repository.update(id, {
      ...(dto.name && { name: dto.name }),
      ...(dto.domain !== undefined && { domain: dto.domain }),
      ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.settings && { settings: { ...(tenant.settings as any), ...dto.settings } }),
    });

    this.eventEmitter.emit('tenant.updated', { tenantId: id, updatedBy: user.id });
    return updated;
  }
}
