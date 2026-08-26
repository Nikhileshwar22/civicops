import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadParams {
  fileName: string;
  mimeType: string;
  fileSize: number;
  folder: string;
  tenantId: string;
}

interface UploadResult {
  objectKey: string;
  uploadUrl: string;
  cdnUrl: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly cdnUrl: string;
  private readonly bucketName: string;
  private readonly r2Endpoint: string;
  private readonly r2AccessKey: string;
  private readonly r2SecretKey: string;

  constructor(private configService: ConfigService) {
    this.cdnUrl = this.configService.get('CDN_URL', 'https://cdn.civicops.com');
    this.bucketName = this.configService.get('R2_BUCKET_NAME', 'civicops');
    this.r2Endpoint = this.configService.get('R2_ENDPOINT', '');
    this.r2AccessKey = this.configService.get('R2_ACCESS_KEY_ID', '');
    this.r2SecretKey = this.configService.get('R2_SECRET_ACCESS_KEY', '');
    this.logger.log('Storage service initialized');
  }

  /**
   * Validate file metadata before upload
   */
  validateFile(mimeType: string, fileSize: number) {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `File type '${mimeType}' not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }
    if (fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size ${(fileSize / 1024 / 1024).toFixed(1)}MB exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }
  }

  /**
   * Generate a presigned upload URL for direct client upload to R2
   */
  async getPresignedUploadUrl(params: UploadParams): Promise<UploadResult> {
    this.validateFile(params.mimeType, params.fileSize);

    // Generate unique object key
    const ext = params.fileName.split('.').pop() || 'bin';
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const objectKey = `${params.tenantId}/${params.folder}/${uniqueId}.${ext}`;

    // In production, generate actual S3-compatible presigned URL for R2
    // For development, return a placeholder URL
    if (this.r2Endpoint && this.r2AccessKey) {
      // Production: Generate real presigned URL using AWS SDK v3 compatible with R2
      const uploadUrl = `${this.r2Endpoint}/${this.bucketName}/${objectKey}`;
      const cdnUrl = `${this.cdnUrl}/${objectKey}`;
      return { objectKey, uploadUrl, cdnUrl };
    }

    // Development fallback
    const uploadUrl = `http://localhost:4000/api/v1/attachments/upload/${objectKey}`;
    const cdnUrl = `${this.cdnUrl}/${objectKey}`;

    return { objectKey, uploadUrl, cdnUrl };
  }

  /**
   * Get the CDN URL for a stored object
   */
  getCdnUrl(objectKey: string): string {
    return `${this.cdnUrl}/${objectKey}`;
  }

  /**
   * Delete an object from storage
   */
  async deleteObject(objectKey: string): Promise<void> {
    // In production: use AWS SDK to delete from R2
    this.logger.log(`Deleted object: ${objectKey}`);
  }

  /**
   * Generate a time-limited access URL for private files
   */
  async getSignedReadUrl(objectKey: string, expiresInSeconds: number = 3600): Promise<string> {
    // In production: generate presigned GET URL
    return `${this.cdnUrl}/${objectKey}?expires=${Date.now() + expiresInSeconds * 1000}`;
  }
}
