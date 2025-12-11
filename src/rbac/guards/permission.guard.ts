
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../rbac.service';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { Module, Permission } from '../rbac.constants';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check single permission
    const requiredPermission = this.reflector.getAllAndOverride<{
      module: Module;
      action: Permission;
    }>(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    // Check ANY permission
    const anyPermissions = this.reflector.getAllAndOverride<Array<{
      module: Module;
      action: Permission;
    }>>('any_permissions', [context.getHandler(), context.getClass()]);

    // Check ALL permissions
    const allPermissions = this.reflector.getAllAndOverride<Array<{
      module: Module;
      action: Permission;
    }>>('all_permissions', [context.getHandler(), context.getClass()]);

    if (!requiredPermission && !anyPermissions && !allPermissions) {
      return true; // No permission required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Single permission check
    if (requiredPermission) {
      const hasPermission = await this.rbacService.checkPermission(
        user.id,
        requiredPermission.module,
        requiredPermission.action,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `You don't have ${requiredPermission.action} permission on ${requiredPermission.module} module`,
        );
      }
    }

    // ANY permission check
    if (anyPermissions) {
      const hasAnyPermission = await this.rbacService.checkAnyPermission(user.id, anyPermissions);
      if (!hasAnyPermission) {
        throw new ForbiddenException('You don\'t have any of the required permissions');
      }
    }

    // ALL permissions check
    if (allPermissions) {
      const hasAllPermissions = await this.rbacService.checkAllPermissions(user.id, allPermissions);
      if (!hasAllPermissions) {
        throw new ForbiddenException('You don\'t have all the required permissions');
      }
    }

    return true;
  }
}