/**
 * Webhook Delivery Worker
 * Processes webhook delivery jobs with HMAC signatures, retry, and exponential backoff.
 */

import { Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import * as crypto from 'crypto';

const logger = new Logger('WebhookWorker');

interface WebhookJobData {
  webhookId: string;
  deliveryId: string;
  url: string;
  secret: string;
  event: string;
  payload: Record<string, any>;
  attempt: number;
}

export function createWebhookWorker(redisConnection: { host: string; port: number; password?: string }) {
  const worker = new Worker<WebhookJobData>(
    'webhooks',
    async (job: Job<WebhookJobData>) => {
      const { url, secret, event, payload, deliveryId } = job.data;

      logger.log(`Delivering webhook ${deliveryId} to ${url} (event: ${event})`);

      // Generate HMAC signature
      const timestamp = Date.now().toString();
      const body = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${body}`)
        .digest('hex');

      // Deliver
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CivicOps-Signature': `sha256=${signature}`,
            'X-CivicOps-Timestamp': timestamp,
            'X-CivicOps-Event': event,
            'X-CivicOps-Delivery': deliveryId,
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const httpStatus = response.status;
        const responseText = await response.text().catch(() => '');

        if (!response.ok) {
          throw new Error(`HTTP ${httpStatus}: ${responseText.substring(0, 200)}`);
        }

        logger.log(`Webhook ${deliveryId} delivered successfully (${httpStatus})`);
        return { httpStatus, success: true, response: responseText.substring(0, 500) };
      } catch (error: any) {
        clearTimeout(timeout);
        logger.warn(`Webhook ${deliveryId} failed: ${error.message}`);
        throw error; // BullMQ will retry based on job options
      }
    },
    {
      connection: redisConnection,
      concurrency: 10,
    },
  );

  worker.on('completed', (job) => {
    logger.debug(`Webhook job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Webhook job ${job?.id} failed permanently: ${err.message}`);
  });

  return worker;
}
