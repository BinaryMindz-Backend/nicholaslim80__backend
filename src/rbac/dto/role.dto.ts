// create-role.dto.ts
import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsNotEmpty()
  permissions: PermissionDto[];
  
  // Example:
  // {
  //   "name": "finance",
  //   "permissions": [
  //     { "module": "order", "action": "create" },
  //     { "module": "order", "action": "read" },
  //     { "module": "order", "action": "update_order_status" },
  //     { "module": "order", "action": "delete" },
  //     { "module": "transaction", "action": "create" },
  //     { "module": "transaction", "action": "read" },
  //     { "module": "transaction", "action": "update_transaction_status" },
  //     { "module": "transaction", "action": "approve_transaction" }
  //   ]
  // }
}

export class PermissionDto {
  @IsString()
  @IsNotEmpty()
  module: string;

  @IsString()
  @IsNotEmpty()
  action: string;
}

// update-role.dto.ts
export class UpdateRoleDto {
  @IsArray()
  @IsNotEmpty()
  permissions: PermissionDto[];
}