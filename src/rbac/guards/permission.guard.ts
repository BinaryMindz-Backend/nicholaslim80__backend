
// import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { RbacService } from '../rbac.service';
// import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
// import { Module, Permission } from '../rbac.constants';

// @Injectable()
// export class PermissionGuard implements CanActivate {
//   constructor(
//     private reflector: Reflector,
//     private rbacService: RbacService,
//   ) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     // Check single permission
//     const requiredPermission = this.reflector.getAllAndOverride<{
//       module: Module;
//       action: Permission;
//     }>(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

//     // Check ANY permission
//     const anyPermissions = this.reflector.getAllAndOverride<Array<{
//       module: Module;
//       action: Permission;
//     }>>('any_permissions', [context.getHandler(), context.getClass()]);

//     // Check ALL permissions
//     const allPermissions = this.reflector.getAllAndOverride<Array<{
//       module: Module;
//       action: Permission;
//     }>>('all_permissions', [context.getHandler(), context.getClass()]);

//     if (!requiredPermission && !anyPermissions && !allPermissions) {
//       return true; // No permission required
//     }
//       // Authentic 
//      const { user } = context.switchToHttp().getRequest();
   
//     console.log("from permission guard--->",user);
//     if (!user) {
//       throw new ForbiddenException('User not authenticated');
//     }

//     // Single permission check
//     if (requiredPermission) {
//       const hasPermission = await this.rbacService.checkPermission(
//         user.id,
//         requiredPermission.module,
//         requiredPermission.action,
//       );

//       if (!hasPermission) {
//         throw new ForbiddenException(
//           `You don't have ${requiredPermission.action} permission on ${requiredPermission.module} module`,
//         );
//       }
//     }

//     // ANY permission check
//     if (anyPermissions) {
//       const hasAnyPermission = await this.rbacService.checkAnyPermission(user.id, anyPermissions);
//       if (!hasAnyPermission) {
//         throw new ForbiddenException('You don\'t have any of the required permissions');
//       }
//     }

//     // ALL permissions check
//     if (allPermissions) {
//       const hasAllPermissions = await this.rbacService.checkAllPermissions(user.id, allPermissions);

//       if (!hasAllPermissions) {
//         throw new ForbiddenException('You don\'t have all the required permissions');
//       }
//     }

//     return true;
//   }
// }



import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../rbac.service';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { Module, Permission } from '../rbac.constants';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Skip permission check for public routes
    }

    // Check for required permissions
    const requiredPermission = this.reflector.getAllAndOverride<{
      module: Module;
      action: Permission;
    }>(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    const anyPermissions = this.reflector.getAllAndOverride<
      Array<{ module: Module; action: Permission }>
    >('any_permissions', [context.getHandler(), context.getClass()]);

    const allPermissions = this.reflector.getAllAndOverride<
      Array<{ module: Module; action: Permission }>
    >('all_permissions', [context.getHandler(), context.getClass()]);

    // No permission required
    if (!requiredPermission && !anyPermissions && !allPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // User must be authenticated for protected routes
    if (!user) {
      throw new UnauthorizedException('Authentication required');
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
      const hasAnyPermission = await this.rbacService.checkAnyPermission(
        user.id,
        anyPermissions,
      );

      if (!hasAnyPermission) {
        throw new ForbiddenException(
          "You don't have any of the required permissions",
        );
      }
    }

    // ALL permissions check
    if (allPermissions) {
      const hasAllPermissions = await this.rbacService.checkAllPermissions(
        user.id,
        allPermissions,
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException(
          "You don't have all the required permissions",
        );
      }
    }

    return true;
  }
}
