import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { CurrentUser, CurrentUserData } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';

@ApiTags('webhooks')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @RequirePermissions('webhook:view')
  @ApiOperation({ summary: 'List all webhooks' })
  async findAll(@CurrentUser() user: CurrentUserData) {
    return this.webhooksService.findAll(user);
  }

  @Get(':id')
  @RequirePermissions('webhook:view')
  @ApiOperation({ summary: 'Get webhook by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.webhooksService.findOne(id, user);
  }

  @Post()
  @RequirePermissions('webhook:create')
  @ApiOperation({ summary: 'Create a webhook' })
  async create(@Body() dto: CreateWebhookDto, @CurrentUser() user: CurrentUserData) {
    return this.webhooksService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions('webhook:update')
  @ApiOperation({ summary: 'Update a webhook' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.webhooksService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('webhook:delete')
  @ApiOperation({ summary: 'Delete a webhook' })
  async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.webhooksService.delete(id, user);
  }

  @Post(':id/regenerate-secret')
  @RequirePermissions('webhook:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate webhook secret' })
  async regenerateSecret(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.webhooksService.regenerateSecret(id, user);
  }

  @Post(':id/test')
  @RequirePermissions('webhook:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test webhook delivery' })
  async test(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.webhooksService.testWebhook(id, user);
  }

  @Get(':id/deliveries')
  @RequirePermissions('webhook:view')
  @ApiOperation({ summary: 'Get webhook delivery history' })
  async getDeliveries(
    @Param('id') id: string,
    @Query() filter: any,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.webhooksService.getDeliveries(id, filter, user);
  }
}
