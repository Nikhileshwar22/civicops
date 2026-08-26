import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class AttachmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    complaintId: string;
    tenantId: string;
    objectKey: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    uploadedBy: string;
  }) {
    return this.prisma.complaintAttachment.create({ data });
  }

  async findByComplaint(complaintId: string) {
    return this.prisma.complaintAttachment.findMany({
      where: { complaintId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.complaintAttachment.findUnique({ where: { id } });
  }

  async delete(id: string) {
    return this.prisma.complaintAttachment.delete({ where: { id } });
  }
}
