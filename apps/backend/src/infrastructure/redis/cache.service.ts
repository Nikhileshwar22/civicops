import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

// Cache TTLs (in seconds)
const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  GEOGRAPHY: 3600,
  DEPARTMENTS: 3600,
  DASHBOARD: 120,
  USER_PERMISSIONS: 300,
};

/**
 * Higher-level caching service built on RedisService
 * Provides typed cache operations with automatic TTL management
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Get or set pattern: fetch from cache, or execute factory and cache result
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.redis.getJson<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await factory();
    await this.redis.setJson(key, result, ttlSeconds || CACHE_TTL.MEDIUM);
    return result;
  }

  /**
   * Cache geography data (zones, circles, wards) - long TTL
   */
  async cacheGeography(tenantId: string, type: 'zones' | 'circles' | 'wards' | 'hierarchy', data: any) {
    const key = `geo:${tenantId}:${type}`;
    await this.redis.setJson(key, data, CACHE_TTL.GEOGRAPHY);
  }

  async getGeography<T>(tenantId: string, type: 'zones' | 'circles' | 'wards' | 'hierarchy'): Promise<T | null> {
    return this.redis.getJson<T>(`geo:${tenantId}:${type}`);
  }

  async invalidateGeography(tenantId: string) {
    await this.redis.invalidatePattern(`geo:${tenantId}:*`);
    this.logger.debug(`Invalidated geography cache for tenant ${tenantId}`);
  }

  /**
   * Cache department data
   */
  async cacheDepartments(tenantId: string, data: any) {
    await this.redis.setJson(`dept:${tenantId}`, data, CACHE_TTL.DEPARTMENTS);
  }

  async getDepartments<T>(tenantId: string): Promise<T | null> {
    return this.redis.getJson<T>(`dept:${tenantId}`);
  }

  async invalidateDepartments(tenantId: string) {
    await this.redis.del(`dept:${tenantId}`);
  }

  /**
   * Cache dashboard statistics - short TTL
   */
  async cacheDashboardStats(tenantId: string, role: string, data: any) {
    const key = `dashboard:${tenantId}:${role}`;
    await this.redis.setJson(key, data, CACHE_TTL.DASHBOARD);
  }

  async getDashboardStats<T>(tenantId: string, role: string): Promise<T | null> {
    return this.redis.getJson<T>(`dashboard:${tenantId}:${role}`);
  }

  async invalidateDashboardStats(tenantId: string) {
    await this.redis.invalidatePattern(`dashboard:${tenantId}:*`);
  }

  /**
   * Cache user permissions - medium TTL
   */
  async cacheUserPermissions(userId: string, data: any) {
    await this.redis.setJson(`perms:${userId}`, data, CACHE_TTL.USER_PERMISSIONS);
  }

  async getUserPermissions<T>(userId: string): Promise<T | null> {
    return this.redis.getJson<T>(`perms:${userId}`);
  }

  async invalidateUserPermissions(userId: string) {
    await this.redis.del(`perms:${userId}`);
  }

  /**
   * Generic invalidation
   */
  async invalidate(key: string) {
    await this.redis.del(key);
  }

  async invalidateByPattern(pattern: string) {
    await this.redis.invalidatePattern(pattern);
  }
}
