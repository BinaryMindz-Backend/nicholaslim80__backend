/* eslint-disable @typescript-eslint/require-await */
import { Injectable, OnModuleInit, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Module, Permission, STATIC_ROLES } from './rbac.constants';
import { PrismaService } from 'src/core/database/prisma.service';
import { PermissionDto } from './dto/role.dto';



@Injectable()
export class RbacService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.initializeStaticRoles();
  }

  private async initializeStaticRoles() {
    const staticRoles = [
      {
        name: STATIC_ROLES.SUPER_ADMIN,
        permissions: [
          // Full access to all modules
          { module: Module.USER, action: Permission.CREATE },
          { module: Module.USER, action: Permission.READ },
          { module: Module.USER, action: Permission.UPDATE_USER_PROFILE },
          { module: Module.USER, action: Permission.UPDATE_USER_ROLE },
          { module: Module.USER, action: Permission.UPDATE_USER_STATUS },
          { module: Module.USER, action: Permission.DELETE },
          
          { module: Module.ORDER, action: Permission.CREATE },
          { module: Module.ORDER, action: Permission.READ },
          { module: Module.ORDER, action: Permission.UPDATE_ORDER_STATUS },
          { module: Module.ORDER, action: Permission.UPDATE_ORDER_DETAILS },
          { module: Module.ORDER, action: Permission.UPDATE_ORDER_PRICE },
          { module: Module.ORDER, action: Permission.CANCEL_ORDER },
          { module: Module.ORDER, action: Permission.DELETE },
          
          { module: Module.TRANSACTION, action: Permission.CREATE },
          { module: Module.TRANSACTION, action: Permission.READ },
          { module: Module.TRANSACTION, action: Permission.UPDATE_TRANSACTION_STATUS },
          { module: Module.TRANSACTION, action: Permission.UPDATE_TRANSACTION_AMOUNT },
          { module: Module.TRANSACTION, action: Permission.APPROVE_TRANSACTION },
          { module: Module.TRANSACTION, action: Permission.REFUND_TRANSACTION },
          { module: Module.TRANSACTION, action: Permission.DELETE },
          
          { module: Module.SERVICES, action: Permission.CREATE },
          { module: Module.SERVICES, action: Permission.READ },
          { module: Module.SERVICES, action: Permission.UPDATE_SERVICE_DETAILS },
          { module: Module.SERVICES, action: Permission.UPDATE_SERVICE_PRICING },
          { module: Module.SERVICES, action: Permission.UPDATE_SERVICE_STATUS },
          { module: Module.SERVICES, action: Permission.DELETE },
        ],
      },
      {
        name: STATIC_ROLES.RAIDER,
        permissions: [
          { module: Module.ORDER, action: Permission.CREATE },
          { module: Module.ORDER, action: Permission.READ },
          { module: Module.ORDER, action: Permission.UPDATE_ORDER_STATUS },
          { module: Module.SERVICES, action: Permission.READ },
        ],
      },
      {
        name: STATIC_ROLES.USER,
        permissions: [
          { module: Module.ORDER, action: Permission.CREATE },
          { module: Module.ORDER, action: Permission.READ },
          { module: Module.SERVICES, action: Permission.READ },
        ],
      },
    ];

    for (const role of staticRoles) {
      const existingRole = await this.prisma.role.findUnique({
        where: { name: role.name },
      });

      if (!existingRole) {
        await this.prisma.role.create({
          data: {
            name: role.name,
            isStatic: true,
            permissions: {
              create: role.permissions,
            },
          },
        });
      }
    }
  }

  async createCustomRole(name: string, permissions: PermissionDto[]) {
    const existingRole = await this.prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      throw new ConflictException(`Role '${name}' already exists`);
    }

    const role = await this.prisma.role.create({
      data: {
        name,
        isStatic: false,
        permissions: {
          create: permissions,
        },
      },
      include: {
        permissions: true,
      },
    });

    return role;
  }

  async updateRolePermissions(roleId: number, permissions: PermissionDto[]) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isStatic) {
      throw new BadRequestException('Cannot modify static roles');
    }

    // Delete existing permissions
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Create new permissions
    const updatedRole = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          create: permissions,
        },
      },
      include: {
        permissions: true,
      },
    });

    return updatedRole;
  }

  async deleteRole(roleId: number) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isStatic) {
      throw new BadRequestException('Cannot delete static roles');
    }

    await this.prisma.role.delete({
      where: { id: roleId },
    });

    return { message: 'Role deleted successfully' };
  }

  async checkPermission(userId: number, module: Module, action: Permission): Promise<boolean> {
    const permission = await this.prisma.rolePermission.findFirst({
      where: {
        role: {
          users: {
            some: { id: userId },
          },
        },
        module,
        action,
      },
    });

    return !!permission;
  }

  async checkAnyPermission(userId: number, permissions: Array<{ module: Module; action: Permission }>): Promise<boolean> {
    for (const perm of permissions) {
      const hasPermission = await this.checkPermission(userId, perm.module, perm.action);
      if (hasPermission) return true;
    }
    return false;
  }

  async checkAllPermissions(userId: number, permissions: Array<{ module: Module; action: Permission }>): Promise<boolean> {
    for (const perm of permissions) {
      const hasPermission = await this.checkPermission(userId, perm.module, perm.action);
      if (!hasPermission) return false;
    }
    return true;
  }

  async getUserPermissions(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Group permissions by module
    const permissionsByModule: Record<string, string[]> = {};
    user.role.permissions.forEach((perm) => {
      if (!permissionsByModule[perm.module]) {
        permissionsByModule[perm.module] = [];
      }
      permissionsByModule[perm.module].push(perm.action);
    });

    return {
      roleName: user.role.name,
      permissions: permissionsByModule,
      detailedPermissions: user.role.permissions,
    };
  }

  async getAllRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: true,
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async getRoleById(roleId: number) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: true,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async getAvailablePermissions() {
    // Return all available granular permissions grouped by module
    return {
      [Module.USER]: [
        Permission.CREATE,
        Permission.READ,
        Permission.UPDATE_USER_PROFILE,
        Permission.UPDATE_USER_ROLE,
        Permission.UPDATE_USER_STATUS,
        Permission.DELETE,
      ],
      [Module.ORDER]: [
        Permission.CREATE,
        Permission.READ,
        Permission.UPDATE_ORDER_STATUS,
        Permission.UPDATE_ORDER_DETAILS,
        Permission.UPDATE_ORDER_PRICE,
        Permission.CANCEL_ORDER,
        Permission.DELETE,
      ],
      [Module.TRANSACTION]: [
        Permission.CREATE,
        Permission.READ,
        Permission.UPDATE_TRANSACTION_STATUS,
        Permission.UPDATE_TRANSACTION_AMOUNT,
        Permission.APPROVE_TRANSACTION,
        Permission.REFUND_TRANSACTION,
        Permission.DELETE,
      ],
      [Module.SERVICES]: [
        Permission.CREATE,
        Permission.READ,
        Permission.UPDATE_SERVICE_DETAILS,
        Permission.UPDATE_SERVICE_PRICING,
        Permission.UPDATE_SERVICE_STATUS,
        Permission.DELETE,
      ],
    };
  }
}