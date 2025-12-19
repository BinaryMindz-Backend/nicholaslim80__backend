import { Controller, Post, Put, Delete, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RequirePermission } from './decorators/require-permission.decorator';
import { Module, Permission } from './rbac.constants';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';




@Controller('roles')
export class RbacController {
  constructor(private readonly rbacService: RbacService) { }

  @Post()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RBAC, Permission.CREATE)
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rbacService.createCustomRole(
      createRoleDto.name,
      createRoleDto.permissions,
    );
  }

  @Put(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RBAC, Permission.UPDATE_RBAC_ROLE_PERMISSION)
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rbacService.updateRolePermissions(id, updateRoleDto.permissions);
  }

  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RBAC, Permission.DELETE)
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.deleteRole(id);
  }

  @Get()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RBAC, Permission.READ)
  async getAllRoles(@CurrentUser() user: any) {
    console.log(user);
    return this.rbacService.getAllRoles();
  }

  @Get('available-permissions')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RBAC, Permission.READ)
  async getAvailablePermissions() {
    return this.rbacService.getAvailablePermissions();
  }

  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RBAC, Permission.READ)
  async getRole(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.getRoleById(id);
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
}