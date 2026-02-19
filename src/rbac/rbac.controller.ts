import { Controller, Post, Put, Delete, Get, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RequirePermission } from './decorators/require-permission.decorator';
import { Module, Permission } from './rbac.constants';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateRoleDto, SearchDto, UpdateRoleDto, UpdateRoleNameDto } from './dto/role.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ApiResponses } from 'src/common/apiResponse';
import { Public } from 'src/decorators/public.decorator';




@Controller('roles')
export class RbacController {
  constructor(private readonly rbacService: RbacService) { }

  @Post()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RBAC, Permission.CREATE)
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    try {
      const res = await this.rbacService.createCustomRole(
        createRoleDto.name,
        createRoleDto.permissions,
      );
      return ApiResponses.success(res, 'Role created successfully');
    } catch (error) {
      return ApiResponses.error(error, "Failed to create role");
    }
  }
  // 
  @Get("search")
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RBAC, Permission.READ)
  async findAllBySearch(@Query() dto: SearchDto) {
    return this.rbacService.findAllBySearch(dto);
  }

  // 
  @Put('update-role/:id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RBAC, Permission.UPDATE_RBAC_ROLE_PERMISSION)
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleNameDto,
  ) {

    try {
      const res = await this.rbacService.updateRole(id, updateRoleDto.name);
      return ApiResponses.success(res, 'Role name updated successfully');
    } catch (error) {
      return ApiResponses.error(error, "Failed to update role name");
    }


  }

  // 
  @Put(':id/active-status')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RBAC, Permission.UPDATE_RBAC_ROLE_PERMISSION)
  async makeActiveInactive(
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const res = await this.rbacService.makeActiveInactive(id);
      return ApiResponses.success(res, 'Role status updated successfully');
    } catch (error) {
      return ApiResponses.error(error, "Failed to update role status");
    }
  }

  //  
  @Put(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RBAC, Permission.UPDATE_RBAC_ROLE_PERMISSION)
  async updateRolePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rbacService.updateRolePermissions(id, updateRoleDto.permissions);
  }

  // 
  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RBAC, Permission.DELETE)
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    try {
      const res = await this.rbacService.deleteRole(id);
      return ApiResponses.success(res, 'Role deleted successfully');
    } catch (error) {
      return ApiResponses.error(error, "Failed to delete role");
    }
  }

  // 
  @Get()
  @Auth()
  @ApiBearerAuth()
  // @RequirePermission(Module.RBAC, Permission.READ)
  async getAllRoles() {
    return await this.rbacService.getAllRoles();
  }

  // 
  @Get('available-permissions')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RBAC, Permission.READ)
  async getAvailablePermissions() {
    return this.rbacService.getAvailablePermissions();
  }
  // 
  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RBAC, Permission.READ)
  async getRole(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.getRoleById(id);
  }

  @Get(':id/users')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RBAC, Permission.READ)
  async getUserByRole(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.getUsersByRole(id);
  }


  // find all available role
  @Get('user/permissions')
  @Auth()
  @ApiBearerAuth()
  // @RequirePermission(Module.RBAC, Permission.READ)
  async getMyPermissions(@CurrentUser() user: any) {
    // console.log(user);
    return this.rbacService.getUserPermissions(user.id);
  }
  // 
  //   @Get('debug/my-permissions')
  // @Auth()
  // @ApiBearerAuth()
  // async debugMyPermissions(@CurrentUser() user: any) {
  //   const permissions = await this.rbacService.getUserPermissions(user.id);
  //   return {
  //     userId: user.id,
  //     permissions,
  //     hasUserRead: permissions.some(
  //       p => p.module === 'user' && p.action === 'read'
  //     )
  //   };
  // }
  // 

  // roles.controller.ts
  @Delete(':roleId/users/:userId')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RBAC, Permission.DELETE)
  @ApiOperation({ summary: 'Remove a user from a role' })
  async removeUserFromRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('userId', ParseIntPipe) userId: number
  ) {
    try {
      const res = await this.rbacService.removeUserFromRole(roleId, userId);
      return ApiResponses.success(res, 'User removed from role successfully');
    } catch (error) {
      return ApiResponses.error(error, "Failed to remove user from role");
    }
  }

  // 
  @Post(':roleId/users/:userId')
  @Public()
  @ApiOperation({ summary: 'Add a user to a role' })
  async addUserToRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('userId', ParseIntPipe) userId: number
  ) {
    try {
      const res = await this.rbacService.addUserToRole(roleId, userId);
      return ApiResponses.success(res, 'User added to role successfully');
    } catch (error) {
      return ApiResponses.error(error, "Failed to add user to role");
    }
  }


}