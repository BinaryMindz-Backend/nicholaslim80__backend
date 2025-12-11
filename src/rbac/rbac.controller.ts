import { Controller, Post, Put, Delete, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RequirePermission } from './decorators/require-permission.decorator';
import { Module, Permission } from './rbac.constants';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Controller('roles')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Post()
  @RequirePermission(Module.USER, Permission.UPDATE_USER_ROLE)
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rbacService.createCustomRole(
      createRoleDto.name,
      createRoleDto.permissions,
    );
  }

  @Put(':id')
  @RequirePermission(Module.USER, Permission.UPDATE_USER_ROLE)
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rbacService.updateRolePermissions(id, updateRoleDto.permissions);
  }

  @Delete(':id')
  @RequirePermission(Module.USER, Permission.UPDATE_USER_ROLE)
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.deleteRole(id);
  }

  @Get()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.USER, Permission.READ)
  async getAllRoles() {
    return this.rbacService.getAllRoles();
  }

  @Get('available-permissions')
  @RequirePermission(Module.USER, Permission.READ)
  async getAvailablePermissions() {
    return this.rbacService.getAvailablePermissions();
  }

  @Get(':id')
  @RequirePermission(Module.USER, Permission.READ)
  async getRole(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.getRoleById(id);
  }

  @Get('user/permissions')
  async getMyPermissions(@CurrentUser() user: any) {
    return this.rbacService.getUserPermissions(user.id);
  }
}