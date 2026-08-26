import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class GeographyRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ====== ZONES ======

  async findAllZones(tenantId: string) {
    return this.prisma.zone.findMany({
      where: { tenantId },
      include: {
        circles: {
          include: { wards: { orderBy: { number: 'asc' } } },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findZoneById(id: string) {
    return this.prisma.zone.findUnique({
      where: { id },
      include: {
        circles: {
          include: { wards: { orderBy: { number: 'asc' } } },
          orderBy: { name: 'asc' },
        },
        _count: { select: { complaints: true } },
      },
    });
  }

  async createZone(data: any) {
    return this.prisma.zone.create({ data });
  }

  async updateZone(id: string, data: any) {
    return this.prisma.zone.update({ where: { id }, data });
  }

  // ====== CIRCLES ======

  async findAllCircles(tenantId: string, zoneId?: string) {
    const where: any = { tenantId };
    if (zoneId) where.zoneId = zoneId;
    return this.prisma.circle.findMany({
      where,
      include: {
        zone: { select: { id: true, name: true } },
        wards: { orderBy: { number: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findCircleById(id: string) {
    return this.prisma.circle.findUnique({
      where: { id },
      include: {
        zone: { select: { id: true, name: true } },
        wards: { orderBy: { number: 'asc' } },
        _count: { select: { complaints: true } },
      },
    });
  }

  async createCircle(data: any) {
    return this.prisma.circle.create({ data });
  }

  async updateCircle(id: string, data: any) {
    return this.prisma.circle.update({ where: { id }, data });
  }

  // ====== WARDS ======

  async findAllWards(tenantId: string, circleId?: string, zoneId?: string) {
    const where: any = { tenantId };
    if (circleId) where.circleId = circleId;
    if (zoneId) where.zoneId = zoneId;
    return this.prisma.ward.findMany({
      where,
      include: {
        zone: { select: { id: true, name: true } },
        circle: { select: { id: true, name: true } },
        _count: { select: { complaints: true } },
      },
      orderBy: { number: 'asc' },
    });
  }

  async findWardById(id: string) {
    return this.prisma.ward.findUnique({
      where: { id },
      include: {
        zone: { select: { id: true, name: true } },
        circle: { select: { id: true, name: true } },
        _count: { select: { complaints: true } },
      },
    });
  }

  async createWard(data: any) {
    return this.prisma.ward.create({ data });
  }

  async updateWard(id: string, data: any) {
    return this.prisma.ward.update({ where: { id }, data });
  }
}
