/* eslint-disable @typescript-eslint/require-await */
import { Injectable, OnModuleInit, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Module, Permission, STATIC_ROLES } from './rbac.constants';
import { PrismaService } from 'src/core/database/prisma.service';
import { PermissionDto, SearchDto } from './dto/role.dto';
import { DeliveryTypeName, OrderStatus } from '@prisma/client';
import { RoleQueryDto } from './dto/serach_pagination.dto';
import { ActivityLogService } from 'src/modules/superadmin_root/additional_services/activity_logs.services';



@Injectable()
export class RbacService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) { }

  async onModuleInit() {
    await this.initializeStaticRoles();
  }

  private async initializeStaticRoles() {
    const staticRoles = [
      {
        name: STATIC_ROLES.ADMIN,
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
          { module: Module.ORDER, action: Permission.CANCEL_ORDER },
          { module: Module.ORDER, action: Permission.DELETE },
        ],
      },
      {
        name: STATIC_ROLES.RAIDER,
        permissions: [
          { module: Module.USER, action: Permission.GET_USER_PROFILE },
          { module: Module.USER, action: Permission.UPDATE },
        ],
      },
      {
        name: STATIC_ROLES.USER,
        permissions: [
          { module: Module.USER, action: Permission.READ },
          { module: Module.USER, action: Permission.UPDATE },
          { module: Module.USER, action: Permission.GET_USER_PROFILE },


        ],
      },
    ];

    // Creating Dynamic role
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

  // ---------------- CREATE CUSTOM ROLE ----------------
  async createCustomRole(name: string, permissions: PermissionDto[], userId: number) {
    const existingRole = await this.prisma.role.findUnique({ where: { name } });
    if (existingRole) throw new ConflictException(`Role '${name}' already exists`);

    const role = await this.prisma.role.create({
      data: {
        name,
        isStatic: false,
        permissions: { create: permissions },
      },
      include: { permissions: true },
    });

    // LOG
    await this.activityLogService.log({
      action: 'CREATE',
      entityType: 'Role',
      entityId: role.id,
      userId,
      meta: { data: role },
    });

    return role;
  }


  // ---------------- UPDATE ROLE PERMISSIONS ----------------
  async updateRolePermissions(roleId: number, permissions: PermissionDto[], userId: number) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: true },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isStatic) throw new BadRequestException('Cannot modify static roles');

    const oldPermissions = role.permissions;

    // Delete old permissions
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });

    const updatedRole = await this.prisma.role.update({
      where: { id: roleId },
      data: { permissions: { create: permissions } },
      include: { permissions: true },
    });

    // LOG
    await this.activityLogService.log({
      action: 'UPDATE',
      entityType: 'Role',
      entityId: roleId,
      userId,
      meta: { before: oldPermissions, after: updatedRole.permissions },
    });

    return updatedRole;
  }

  //  
  async getAllRoles(query: RoleQueryDto) {
    const { search, page = 1, limit = 10 } = query;

    // Calculate how many records to skip
    const skip = (page - 1) * limit;

    // Define the filter criteria
    const where: any = {
      isStatic: { not: true },
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive', // Makes search case-insensitive
        },
      }),
    };

    // Fetch data and total count in parallel for better performance
    const [data, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        include: {
          permissions: true,
          _count: {
            select: { users: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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
  //  
  async getUsersByRole(roleId: number) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            phone: true,
          }
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  // ---------------- UPDATE ROLE NAME ----------------
  async updateRole(roleId: number, name: string, userId: number) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isStatic) throw new BadRequestException('Cannot modify static roles');

    const updatedRole = await this.prisma.role.update({
      where: { id: roleId },
      data: { name },
    });

    // LOG
    await this.activityLogService.log({
      action: 'UPDATE',
      entityType: 'Role',
      entityId: roleId,
      userId,
      meta: { before: role, after: updatedRole },
    });

    return updatedRole;
  }

  // 
  // ---------------- ACTIVATE / DEACTIVATE ----------------
  async makeActiveInactive(roleId: number, userId: number) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isStatic) throw new BadRequestException('Cannot modify static roles');

    const updatedRole = await this.prisma.role.update({
      where: { id: roleId },
      data: { isActive: !role.isActive },
    });

    // LOG
    await this.activityLogService.log({
      action: 'UPDATE',
      entityType: 'Role',
      entityId: roleId,
      userId,
      meta: { before: role, after: updatedRole },
    });

    return updatedRole;
  }

  // 
  // ---------------- DELETE ROLE ----------------
  async deleteRole(roleId: number, userId: number) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isStatic) throw new BadRequestException('Cannot delete static roles');

    const usersWithRole = await this.prisma.user.count({
      where: { roles: { some: { id: roleId } } },
    });

    if (usersWithRole > 0) throw new BadRequestException('Cannot delete role assigned to users');

    await this.prisma.role.delete({ where: { id: roleId } });

    // LOG
    await this.activityLogService.log({
      action: 'DELETE',
      entityType: 'Role',
      entityId: roleId,
      userId,
      meta: { deletedData: role },
    });

    return { message: 'Role deleted successfully' };
  }

  //  
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
    console.log("permission--->", permission, userId, module, action);
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
        roles: {
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
    user.roles.map(r => (
      r.permissions.forEach((perm) => {
        if (!permissionsByModule[perm.module]) {
          permissionsByModule[perm.module] = [];
        }
        permissionsByModule[perm.module].push(perm.action);
      })
    ))

    return {
      roleName: user.roles?.map(r => r.name) ?? [],
      permissions: permissionsByModule,
      detailedPermissions: user.roles.map(r => r.permissions) ?? [],
    };
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
        Permission.CANCEL_ORDER,
        Permission.DELETE,
      ],

    };
  }
  // 
  // Service
  async findAllBySearch(dto: SearchDto) {

    const searchTerm = dto.search.trim();
    const isNumeric = !isNaN(Number(searchTerm));

    // Search in 3 tables parallelly
    const [orderResults, userResults, raiderResults] = await Promise.all([
      // 1. Search in ORDER table
      this.prisma.order.findMany({
        where: {
          OR: [
            // Order ID
            ...(isNumeric ? [{ id: Number(searchTerm) }] : []),

            // Order status (enum exact match)
            ...(Object.values(OrderStatus).includes(searchTerm.toUpperCase() as OrderStatus)
              ? [{ order_status: searchTerm.toUpperCase() as OrderStatus }]
              : []),


            // Delivery type (enum exact match)
            ...(Object.values(DeliveryTypeName).includes(searchTerm.toUpperCase() as DeliveryTypeName)
              ? [{ delivery_type: searchTerm.toUpperCase() as DeliveryTypeName }]
              : []),
          ],
        },
      }),

      // 2. Search in USER table
      this.prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        include: {
          roles: true,
        }
      }),

      // 3. Search in RAIDER table
      this.prisma.raider.findMany({
        where: {
          registrations: {
            some: {
              OR: [
                { raider_name: { contains: searchTerm, mode: 'insensitive' } },
                { current_address: { contains: searchTerm, mode: 'insensitive' } },
                { contact_number: { contains: searchTerm, mode: 'insensitive' } },
                { email_address: { contains: searchTerm, mode: 'insensitive' } },
                { permanent_address: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          },
        },
        include: {
          registrations: true
        }
      }),
    ]);

    return {
      orders: orderResults,
      users: userResults,
      raiders: raiderResults
    }


  }

  //
  async removeUserFromRole(roleId: number, userId: number) {

    const existingRole = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      throw new NotFoundException('Role not found');
    }

    if (existingRole.isStatic) {
      throw new BadRequestException('Cannot remove user from static role like admin, user, raider');
    }
    // check user is exist in role
    const existingUser = await this.prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }
    const role = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        users: {
          disconnect: { id: userId }, // this removes the relation
        },
      },
    });

    return {
      message: `User ${userId} removed from role ${roleId}`,
      role,
    };
  }
  //add user to role
  async addUserToRole(roleId: number, userId: number) {
    const role = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        users: {
          connect: { id: userId }, // this adds the relation
        },
      },
    });

    return {
      message: `User ${userId} added to role ${roleId}`,
      role,
    };
  }


}