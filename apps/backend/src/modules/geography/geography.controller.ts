import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GeographyService } from './geography.service';
import { CurrentUser, CurrentUserData } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';

@ApiTags('geography')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('geography')
export class GeographyController {
  constructor(private readonly geographyService: GeographyService) {}

  @Get('hierarchy')
  @RequirePermissions('geography:view')
  @ApiOperation({ summary: 'Get full geographic hierarchy (zones > circles > wards)' })
  async getHierarchy(@CurrentUser() user: CurrentUserData) {
    return this.geographyService.getHierarchy(user);
  }

  // ====== ZONES ======

  @Get('zones')
  @RequirePermissions('geography:view')
  @ApiOperation({ summary: 'List all zones' })
  async findAllZones(@CurrentUser() user: CurrentUserData) {
    return this.geographyService.findAllZones(user);
  }

  @Get('zones/:id')
  @RequirePermissions('geography:view')
  @ApiOperation({ summary: 'Get zone by ID' })
  async findZone(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.geographyService.findZoneById(id, user);
  }

  @Post('zones')
  @RequirePermissions('zone:manage')
  @ApiOperation({ summary: 'Create a zone' })
  async createZone(@Body() body: any, @CurrentUser() user: CurrentUserData) {
    return this.geographyService.createZone(body, user);
  }

  @Patch('zones/:id')
  @RequirePermissions('zone:manage')
  @ApiOperation({ summary: 'Update a zone' })
  async updateZone(@Param('id') id: string, @Body() body: any, @CurrentUser() user: CurrentUserData) {
    return this.geographyService.updateZone(id, body, user);
  }

  // ====== CIRCLES ======

  @Get('circles')
  @RequirePermissions('geography:view')
  @ApiOperation({ summary: 'List circles (optionally filter by zone)' })
  async findAllCircles(@Query('zoneId') zoneId: string, @CurrentUser() user: CurrentUserData) {
    return this.geographyService.findAllCircles(user, zoneId);
  }

  @Get('circles/:id')
  @RequirePermissions('geography:view')
  @ApiOperation({ summary: 'Get circle by ID' })
  async findCircle(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.geographyService.findCircleById(id, user);
  }

  @Post('circles')
  @RequirePermissions('zone:manage')
  @ApiOperation({ summary: 'Create a circle' })
  async createCircle(@Body() body: any, @CurrentUser() user: CurrentUserData) {
    return this.geographyService.createCircle(body, user);
  }

  @Patch('circles/:id')
  @RequirePermissions('zone:manage')
  @ApiOperation({ summary: 'Update a circle' })
  async updateCircle(@Param('id') id: string, @Body() body: any, @CurrentUser() user: CurrentUserData) {
    return this.geographyService.updateCircle(id, body, user);
  }

  // ====== WARDS ======

  @Get('wards')
  @RequirePermissions('geography:view')
  @ApiOperation({ summary: 'List wards (optionally filter by circle or zone)' })
  async findAllWards(
    @Query('circleId') circleId: string,
    @Query('zoneId') zoneId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.geographyService.findAllWards(user, circleId, zoneId);
  }

  @Get('wards/:id')
  @RequirePermissions('geography:view')
  @ApiOperation({ summary: 'Get ward by ID' })
  async findWard(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.geographyService.findWardById(id, user);
  }

  @Post('wards')
  @RequirePermissions('zone:manage')
  @ApiOperation({ summary: 'Create a ward' })
  async createWard(@Body() body: any, @CurrentUser() user: CurrentUserData) {
    return this.geographyService.createWard(body, user);
  }

  @Patch('wards/:id')
  @RequirePermissions('zone:manage')
  @ApiOperation({ summary: 'Update a ward' })
  async updateWard(@Param('id') id: string, @Body() body: any, @CurrentUser() user: CurrentUserData) {
    return this.geographyService.updateWard(id, body, user);
  }
}
