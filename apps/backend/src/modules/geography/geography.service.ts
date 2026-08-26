import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { GeographyRepository } from './geography.repository';
import { CacheService } from '@/infrastructure/redis/cache.service';
import { CurrentUserData } from '@/common/decorators/current-user.decorator';

@Injectable()
export class GeographyService {
  private readonly logger = new Logger(GeographyService.name);

  constructor(
    private readonly repository: GeographyRepository,
    private readonly cacheService: CacheService,
  ) {}

  // ====== ZONES ======

  async findAllZones(user: CurrentUserData) {
    return this.cacheService.getOrSet(
      `geo:${user.tenantId}:zones`,
      () => this.repository.findAllZones(user.tenantId),
      3600,
    );
  }

  async findZoneById(id: string, user: CurrentUserData) {
    const zone = await this.repository.findZoneById(id);
    if (!zone || zone.tenantId !== user.tenantId) {
      throw new NotFoundException('Zone not found');
    }
    return zone;
  }

  async createZone(data: any, user: CurrentUserData) {
    const zone = await this.repository.createZone({
      name: data.name,
      code: data.code,
      tenantId: user.tenantId,
    });
    await this.cacheService.invalidateGeography(user.tenantId);
    return zone;
  }

  async updateZone(id: string, data: any, user: CurrentUserData) {
    await this.findZoneById(id, user);
    const updated = await this.repository.updateZone(id, data);
    await this.cacheService.invalidateGeography(user.tenantId);
    return updated;
  }

  // ====== CIRCLES ======

  async findAllCircles(user: CurrentUserData, zoneId?: string) {
    const key = zoneId ? `geo:${user.tenantId}:circles:${zoneId}` : `geo:${user.tenantId}:circles`;
    return this.cacheService.getOrSet(
      key,
      () => this.repository.findAllCircles(user.tenantId, zoneId),
      3600,
    );
  }

  async findCircleById(id: string, user: CurrentUserData) {
    const circle = await this.repository.findCircleById(id);
    if (!circle || circle.tenantId !== user.tenantId) {
      throw new NotFoundException('Circle not found');
    }
    return circle;
  }

  async createCircle(data: any, user: CurrentUserData) {
    await this.findZoneById(data.zoneId, user);
    const circle = await this.repository.createCircle({
      name: data.name,
      code: data.code,
      zoneId: data.zoneId,
      tenantId: user.tenantId,
    });
    await this.cacheService.invalidateGeography(user.tenantId);
    return circle;
  }

  async updateCircle(id: string, data: any, user: CurrentUserData) {
    await this.findCircleById(id, user);
    const updated = await this.repository.updateCircle(id, data);
    await this.cacheService.invalidateGeography(user.tenantId);
    return updated;
  }

  // ====== WARDS ======

  async findAllWards(user: CurrentUserData, circleId?: string, zoneId?: string) {
    const key = `geo:${user.tenantId}:wards:${circleId || ''}:${zoneId || ''}`;
    return this.cacheService.getOrSet(
      key,
      () => this.repository.findAllWards(user.tenantId, circleId, zoneId),
      3600,
    );
  }

  async findWardById(id: string, user: CurrentUserData) {
    const ward = await this.repository.findWardById(id);
    if (!ward || ward.tenantId !== user.tenantId) {
      throw new NotFoundException('Ward not found');
    }
    return ward;
  }

  async createWard(data: any, user: CurrentUserData) {
    const circle = await this.findCircleById(data.circleId, user);
    const ward = await this.repository.createWard({
      name: data.name,
      number: data.number,
      circleId: data.circleId,
      zoneId: (circle as any).zone.id,
      tenantId: user.tenantId,
    });
    await this.cacheService.invalidateGeography(user.tenantId);
    return ward;
  }

  async updateWard(id: string, data: any, user: CurrentUserData) {
    await this.findWardById(id, user);
    const updated = await this.repository.updateWard(id, data);
    await this.cacheService.invalidateGeography(user.tenantId);
    return updated;
  }

  // ====== FULL HIERARCHY (cached) ======

  async getHierarchy(user: CurrentUserData) {
    return this.cacheService.getOrSet(
      `geo:${user.tenantId}:hierarchy`,
      () => this.repository.findAllZones(user.tenantId),
      3600,
    );
  }
}
