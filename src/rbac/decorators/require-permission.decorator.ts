// require-permission.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Module, Permission } from '../rbac.constants';

export const PERMISSION_KEY = 'permissions';
export const RequirePermission = (module: Module, action: Permission) =>
  SetMetadata(PERMISSION_KEY, { module, action });

// Multiple permissions (user needs ANY of these)
export const RequireAnyPermission = (...permissions: Array<{ module: Module; action: Permission }>) =>
  SetMetadata('any_permissions', permissions);

// Multiple permissions (user needs ALL of these)
export const RequireAllPermissions = (...permissions: Array<{ module: Module; action: Permission }>) =>
  SetMetadata('all_permissions', permissions);

// current-user.decorator.ts
// import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// import { Module, Permission } from '../rbac.constants';

// export const CurrentUser = createParamDecorator(
//   (data: unknown, ctx: ExecutionContext) => {
//     const request = ctx.switchToHttp().getRequest();
//     return request.user;
//   },
// );