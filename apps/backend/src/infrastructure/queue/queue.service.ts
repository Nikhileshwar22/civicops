import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

export enum QueueName {
  AI_PROCESSING = 'ai-processing',
  EMAIL = 'email',
  NOTIFICATIONS = 'notifications',
  WEBHOOKS = 'webhooks',
  REPORTS = 'reports',
  IMAGE_PROCESSING = 'image-processing',
  SLA_MONITORING = 'sla-monitoring',
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private queues: Map<string, Queue> = new Map();

  constructor(private configService: ConfigService) {
    // Initialize queues on startup
    Object.values(QueueName).forEach((queueName) => {
      this.queues.set(
        queueName,
        new Queue(queueName, {
          connection: {
            host: this.configService.get<string>('REDIS_HOST', 'localhost'),
            port: this.configService.get<number>('REDIS_PORT', 6379),
            password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
          },
          defaultJobOptions: {
            removeOnComplete: 100,
            removeOnFail: 500,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          },
        }),
      );
    });

    this.logger.log(`Initialized ${this.queues.size} queues`);
  }

  getQueue(name: QueueName): Queue {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue '${name}' not found`);
    }
    return queue;
  }

  async addJob<T>(queueName: QueueName, jobName: string, data: T, options?: any) {
    const queue = this.getQueue(queueName);
    return queue.add(jobName, data, options);
  }

  async addBulk<T>(queueName: QueueName, jobs: Array<{ name: string; data: T; opts?: any }>) {
    const queue = this.getQueue(queueName);
    return queue.addBulk(jobs);
  }
}
