import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CurrentUser, CurrentUserData } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('info')
  @RequirePermissions('ai:use')
  @ApiOperation({ summary: 'Get AI provider info' })
  getInfo() {
    return this.aiService.getInfo();
  }

  @Post('classify')
  @RequirePermissions('ai:use')
  @ApiOperation({ summary: 'Classify a complaint using AI' })
  async classify(@Body() body: { complaintId: string }, @CurrentUser() user: CurrentUserData) {
    return this.aiService.classifyComplaint(body.complaintId, user);
  }

  @Post('summarize')
  @RequirePermissions('ai:use')
  @ApiOperation({ summary: 'Summarize a complaint using AI' })
  async summarize(@Body() body: { complaintId: string }, @CurrentUser() user: CurrentUserData) {
    return this.aiService.summarizeComplaint(body.complaintId, user);
  }

  @Post('analyze-image')
  @RequirePermissions('ai:use')
  @ApiOperation({ summary: 'Analyze an image using AI vision' })
  async analyzeImage(
    @Body() body: { imageUrl: string; context?: string },
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.aiService.analyzeImage(body.imageUrl, body.context || '', user);
  }

  @Post('assistant')
  @RequirePermissions('ai:use')
  @ApiOperation({ summary: 'Ask the CivicOps AI assistant a question' })
  async assistant(@Body() body: { message: string }, @CurrentUser() user: CurrentUserData) {
    return this.aiService.assistant(body.message, user);
  }
}
