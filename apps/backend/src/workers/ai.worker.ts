/**
 * AI Processing Worker
 * Handles complaint classification, summarization, and image analysis.
 * Consumes jobs from the 'ai-processing' BullMQ queue.
 */

import { Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';

const logger = new Logger('AIWorker');

interface ClassifyJobData {
  complaintId: string;
  tenantId: string;
  description: string;
  title: string;
}

interface SummarizeJobData {
  complaintId: string;
  tenantId: string;
  description: string;
  comments: string[];
}

interface ImageAnalysisJobData {
  complaintId: string;
  tenantId: string;
  imageUrl: string;
}

export function createAiWorker(redisConnection: { host: string; port: number; password?: string }) {
  const worker = new Worker(
    'ai-processing',
    async (job: Job) => {
      const startTime = Date.now();

      switch (job.name) {
        case 'ai:classify': {
          const data = job.data as ClassifyJobData;
          logger.log(`Classifying complaint ${data.complaintId}`);

          // In production: call AI provider (Gemini/OpenAI)
          // For now, return mock classification
          const result = {
            category: 'POTHOLES',
            subcategory: 'Major road damage',
            priority: 'HIGH',
            suggestedDepartment: 'Roads & Buildings',
            suggestedSlaHours: 24,
            confidence: 0.87,
            reasoning: 'Description mentions road damage and pothole keywords',
            processingTimeMs: Date.now() - startTime,
          };

          logger.log(`Classification complete for ${data.complaintId}: ${result.category} (${result.confidence})`);
          return result;
        }

        case 'ai:summarize': {
          const data = job.data as SummarizeJobData;
          logger.log(`Summarizing complaint ${data.complaintId}`);

          const result = {
            summary: `Complaint regarding: ${data.description.substring(0, 100)}...`,
            keyPoints: ['Issue identified', 'Location specified', 'Photos provided'],
            processingTimeMs: Date.now() - startTime,
          };

          return result;
        }

        case 'ai:analyze-image': {
          const data = job.data as ImageAnalysisJobData;
          logger.log(`Analyzing image for complaint ${data.complaintId}`);

          const result = {
            detectedIssue: 'Road damage - pothole',
            severity: 'HIGH',
            confidence: 0.82,
            processingTimeMs: Date.now() - startTime,
          };

          return result;
        }

        default:
          logger.warn(`Unknown job type: ${job.name}`);
      }
    },
    {
      connection: redisConnection,
      concurrency: 3,
    },
  );

  worker.on('completed', (job) => {
    logger.debug(`AI job ${job.id} (${job.name}) completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`AI job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}
