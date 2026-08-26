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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { CurrentUser, CurrentUserData } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: CurrentUserData) {
    return this.usersService.getProfile(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.usersService.updateProfile(dto, user);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.usersService.changePassword(dto, user);
  }

  @Get('assignable-workers')
  @RequirePermissions('complaint:assign')
  @ApiOperation({ summary: 'List field workers/supervisors that can be assigned complaints' })
  async getAssignableWorkers(@CurrentUser() user: CurrentUserData) {
    return this.usersService.getAssignableWorkers(user);
  }

  @Get()
  @RequirePermissions('user:view_all')
  @ApiOperation({ summary: 'List all users (admin)' })
  async findAll(
    @Query() filter: UserFilterDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.usersService.findAll(filter, user);
  }

  @Get(':id')
  @RequirePermissions('user:view')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.usersService.findOne(id, user);
  }

  @Post()
  @RequirePermissions('user:create')
  @ApiOperation({ summary: 'Create a new user (admin)' })
  @ApiResponse({ status: 201, description: 'User created' })
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.usersService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions('user:update')
  @ApiOperation({ summary: 'Update a user (admin)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Post(':id/deactivate')
  @RequirePermissions('user:deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a user' })
  async deactivate(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.usersService.deactivate(id, user);
  }

  @Post(':id/activate')
  @RequirePermissions('user:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a user' })
  async activate(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.usersService.activate(id, user);
  }
}
