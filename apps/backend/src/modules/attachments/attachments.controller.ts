import { Controller, Get, Post, Delete, Param, Body, Res, UseGuards, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { AttachmentsService } from './attachments.service';
import { RequestUploadDto } from './dto/request-upload.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { CurrentUser, CurrentUserData } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { Public } from '@/common/decorators';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

@ApiTags('attachments')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @RequirePermissions('complaint:create|complaint:update|complaint:resolve')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: {
        destination: UPLOADS_DIR,
        filename: (req: any, file: any, cb: any) => {
          const uniqueId = crypto.randomBytes(16).toString('hex');
          const ext = path.extname(file.originalname).toLowerCase();
          cb(null, `${uniqueId}${ext}`);
        },
        _handleFile(req: any, file: any, cb: any) {
          const uniqueId = crypto.randomBytes(16).toString('hex');
          const ext = path.extname(file.originalname).toLowerCase();
          const filename = `${uniqueId}${ext}`;
          const filePath = path.join(UPLOADS_DIR, filename);
          const ws = fs.createWriteStream(filePath);
          file.stream.pipe(ws);
          ws.on('finish', () => cb(null, { filename, path: filePath, size: ws.bytesWritten }));
          ws.on('error', cb);
        },
        _removeFile(req: any, file: any, cb: any) {
          fs.unlink(file.path, cb);
        },
      } as any,
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req: any, file: any, cb: any) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`File type ${file.mimetype} not allowed`), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload files (up to 5, max 10MB each)' })
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: CurrentUserData,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    return files.map((file) => ({
      objectKey: file.filename,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      url: `/api/v1/attachments/file/${file.filename}`,
    }));
  }

  @Get('file/:filename')
  @Public()
  @ApiOperation({ summary: 'Serve uploaded file' })
  async serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const safeName = path.basename(filename);
    const filePath = path.join(UPLOADS_DIR, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    return res.sendFile(filePath);
  }

  @Post('request-upload')
  @RequirePermissions('complaint:create|complaint:update')
  @ApiOperation({ summary: 'Request presigned upload URL (production R2)' })
  async requestUpload(@Body() dto: RequestUploadDto, @CurrentUser() user: CurrentUserData) {
    return this.attachmentsService.requestUpload(dto, user);
  }

  @Post('confirm-upload')
  @RequirePermissions('complaint:create|complaint:update')
  @ApiOperation({ summary: 'Confirm file uploaded and create DB record' })
  async confirmUpload(@Body() dto: ConfirmUploadDto, @CurrentUser() user: CurrentUserData) {
    return this.attachmentsService.confirmUpload(dto, user);
  }

  @Get('complaint/:complaintId')
  @RequirePermissions('complaint:view|complaint:view_all')
  @ApiOperation({ summary: 'Get attachments for a complaint' })
  async getByComplaint(@Param('complaintId') complaintId: string, @CurrentUser() user: CurrentUserData) {
    return this.attachmentsService.getByComplaint(complaintId, user);
  }

  @Delete(':id')
  @RequirePermissions('complaint:update')
  @ApiOperation({ summary: 'Delete an attachment' })
  async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.attachmentsService.delete(id, user);
  }
}
