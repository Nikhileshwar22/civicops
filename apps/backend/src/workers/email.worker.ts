/**
 * Email Worker
 * Processes email notification jobs from the 'email' BullMQ queue.
 * 
 * In production, this would use an SMTP transport (nodemailer).
 * For development, it logs the email that would be sent.
 */

import { Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';

const logger = new Logger('EmailWorker');

interface EmailJobData {
  to?: string;
  userId?: string;
  title: string;
  message: string;
  template?: string;
}

export function createEmailWorker(redisConnection: { host: string; port: number; password?: string }) {
  const worker = new Worker<EmailJobData>(
    'email',
    async (job: Job<EmailJobData>) => {
      logger.log(`Processing email job ${job.id}: ${job.data.title}`);

      // In production: use nodemailer or SendGrid/SES
      // For now, just log
      logger.log(`[DEV] Would send email to user ${job.data.userId}: "${job.data.title}" - ${job.data.message}`);

      return { sent: true, timestamp: new Date().toISOString() };
    },
    {
      connection: redisConnection,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
    },
  );

  worker.on('completed', (job) => {
    logger.debug(`Email job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Email job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}
