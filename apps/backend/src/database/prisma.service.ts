import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Helper for pagination queries
   */
  getPaginationParams(page: number = 1, limit: number = 20) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    return { skip, take };
  }

  /**
   * Helper to build paginated response metadata
   */
  buildPaginationMeta(total: number, page: number = 1, limit: number = 20) {
    const take = Math.min(Math.max(limit, 1), 100);
    const totalPages = Math.ceil(total / take);
    return {
      total,
      page: Math.max(page, 1),
      limit: take,
      totalPages,
      hasNext: Math.max(page, 1) < totalPages,
      hasPrev: Math.max(page, 1) > 1,
    };
  }
}
