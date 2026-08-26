import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { AttachmentsRepository } from './attachments.repository';
import { StorageService } from '@/infrastructure/storage/storage.service';
import { RequestUploadDto } from './dto/request-upload.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { CurrentUserData } from '@/common/decorators/current-user.decorator';

@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);

  constructor(
    private readonly repository: AttachmentsRepository,
    private readonly storageService: StorageService,
  ) {}

  async requestUpload(dto: RequestUploadDto, user: CurrentUserData) {
    this.storageService.validateFile(dto.mimeType, dto.fileSize);

    const result = await this.storageService.getPresignedUploadUrl({
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      fileSize: dto.fileSize,
      folder: 'complaints',
      tenantId: user.tenantId,
    });

    return {
      objectKey: result.objectKey,
      uploadUrl: result.uploadUrl,
      cdnUrl: result.cdnUrl,
    };
  }

  async confirmUpload(dto: ConfirmUploadDto, user: CurrentUserData) {
    const attachment = await this.repository.create({
      complaintId: dto.complaintId,
      tenantId: user.tenantId,
      objectKey: dto.objectKey,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      fileSize: dto.fileSize,
      uploadedBy: user.id,
    });

    return {
      ...attachment,
      url: this.storageService.getCdnUrl(attachment.objectKey),
    };
  }

  async getByComplaint(complaintId: string, user: CurrentUserData) {
    const attachments = await this.repository.findByComplaint(complaintId);
    return attachments.map((a) => ({
      ...a,
      url: this.storageService.getCdnUrl(a.objectKey),
    }));
  }

  async delete(id: string, user: CurrentUserData) {
    const attachment = await this.repository.findById(id);
    if (!attachment) throw new NotFoundException('Attachment not found');
    if (attachment.tenantId !== user.tenantId) throw new NotFoundException('Attachment not found');

    await this.storageService.deleteObject(attachment.objectKey);
    await this.repository.delete(id);

    return { message: 'Attachment deleted' };
  }
}
