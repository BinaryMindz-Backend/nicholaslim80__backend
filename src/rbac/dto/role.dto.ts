// create-role.dto.ts
import { ApiProperty} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'FINANCE',
    description: 'Name of the role',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: [
      { action: 'create', module: 'user' },
      { action: 'update', module: 'advertise' },
    ],
    description: 'List of permissions attached to this role',
    isArray: true,
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
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
  @ApiProperty({
    example: 'advertise',
    description: 'Module where the permission applies',
  })
  @IsString()
  @IsNotEmpty()
  module: string;

  @ApiProperty({
    example: 'create',
    description: 'Action allowed on the module',
  })
  @IsString()
  @IsNotEmpty()
  action: string;
}

// update-role.dto.ts
export class UpdateRoleDto {
  @ApiProperty({
    description: 'Updated list of permissions for this role',
    example: [
      { module: 'user', action: 'update' },
      { module: 'advertise', action: 'delete' },
    ],
    isArray: true,
    type: PermissionDto,
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions: PermissionDto[];
}


export class UpdateRoleNameDto {
  @ApiProperty({
    description: 'Updated name for this role',
    example: 'FINANCE_MANAGER',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}




export class SearchDto {
  @ApiProperty({ 
    description: 'Search across orders, users, and raiders', 
    example: 'John' 
  })
  @IsString()
  search: string;
}