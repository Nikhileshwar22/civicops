import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ComplaintService } from './complaint.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { AssignComplaintDto } from './dto/assign-complaint.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ResolveComplaintDto } from './dto/resolve-complaint.dto';
import { ComplaintFilterDto } from './dto/complaint-filter.dto';
import { CurrentUser, CurrentUserData } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';

@ApiTags('complaints')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('complaints')
export class ComplaintController {
  constructor(private readonly complaintService: ComplaintService) {}

  @Post()
  @RequirePermissions('complaint:create')
  @ApiOperation({ summary: 'Create a new complaint' })
  @ApiResponse({ status: 201, description: 'Complaint created successfully' })
  async create(
    @Body() createDto: CreateComplaintDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.complaintService.create(createDto, user);
  }

  @Get()
  @RequirePermissions('complaint:view|complaint:view_all')
  @ApiOperation({ summary: 'Get complaints (filtered, paginated, scoped)' })
  async findAll(
    @Query() filterDto: ComplaintFilterDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.complaintService.findAll(filterDto, user);
  }

  @Get(':id')
  @RequirePermissions('complaint:view|complaint:view_all')
  @ApiOperation({ summary: 'Get complaint by ID' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.complaintService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions('complaint:update')
  @ApiOperation({ summary: 'Update a complaint' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateComplaintDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.complaintService.update(id, updateDto, user);
  }

  @Patch(':id/status')
  @RequirePermissions('complaint:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update complaint status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.complaintService.updateStatus(id, updateStatusDto, user);
  }

  @Post(':id/assign')
  @RequirePermissions('complaint:assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign complaint to officer/worker' })
  async assign(
    @Param('id') id: string,
    @Body() assignDto: AssignComplaintDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.complaintService.assign(id, assignDto, user);
  }

  @Post(':id/resolve')
  @RequirePermissions('complaint:resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a complaint' })
  async resolve(
    @Param('id') id: string,
    @Body() resolveDto: ResolveComplaintDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.complaintService.resolve(id, resolveDto, user);
  }

  @Post(':id/reopen')
  @RequirePermissions('complaint:reopen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reopen a resolved/closed complaint' })
  async reopen(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.complaintService.reopen(id, user);
  }
}
