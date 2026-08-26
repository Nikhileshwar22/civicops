import { Module } from '@nestjs/common';
import { ComplaintController } from './complaint.controller';
import { ComplaintService } from './complaint.service';
import { ComplaintRepository } from './complaint.repository';

@Module({
  controllers: [ComplaintController],
  providers: [ComplaintService, ComplaintRepository],
  exports: [ComplaintService, ComplaintRepository],
})
export class ComplaintsModule {}
