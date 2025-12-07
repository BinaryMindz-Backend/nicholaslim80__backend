import {
  Controller, Get, Patch, Delete, Param, Body, HttpStatus, ParseIntPipe,
  Query,
  Post
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ApiResponses } from 'src/common/apiResponse';
import { Auth } from 'src/decorators/auth.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';
import { AddMoneyDto } from './dto/add-money.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UserFilterDto } from './dto/user-filter.dto';
import { CreateUserDto } from './dto/create-user.dto';



@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // ** Get all verified users
  @Get("/verified")
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all verified users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAllVerified() {
    try {
      const users = await this.usersService.findAllActiveUsers();
      return ApiResponses.success(users, 'Users retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch users');
    }
  }


  // ** Get all verified users
    @Get()
    @Auth()
    @Roles(UserRole.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all users (with filters & pagination)' })
    @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
    async findAllUsers(@Query() filterDto: UserFilterDto) {
      try {
        const users = await this.usersService.findAllUsers(filterDto);
        return ApiResponses.success(users, 'Users retrieved successfully');
      } catch (err) {
        return ApiResponses.error(err, 'Failed to fetch users');
      }
    }


  //  TODO:need to verify by role
  // add money to wallet 
  @Patch('add-money')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add money to user wallet' })
  @ApiQuery({
    name: 'amount',
    type: Number,
    required: true,
    description: 'Amount to add to the user wallet',
  })
  @ApiResponse({ status: 200, description: 'Money added to wallet successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid amount provided' })
  async addMoney(
    @CurrentUser() user: IUser,
    @Query() dto: AddMoneyDto,
  ) {

    try {
      const updatedWallet = await this.usersService.addMoneyToWallet(
        user.id,
        Number(dto.amount),
      );
      return ApiResponses.success(updatedWallet, 'Money added to wallet successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to update user wallet');
    }
  }


  // find me
  @Get("me")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Own profile' })
  @ApiResponse({ status: 200, description: 'User Own profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User  not found' })
  async findMe(@CurrentUser() user: IUser,) {
    try {
      const profile = await this.usersService.findMe(user);
      return ApiResponses.success(profile, 'User retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch user');
    }

  }



  // ** Get single user by id
  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: number
  ) {
    try {
      const user = await this.usersService.findOneuser(id);
      if (!user) return ApiResponses.error(null, 'User not found');
      return ApiResponses.success(user, 'User retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch user');
    }
  }


  // ** Get delete single user
  @Get('deleted/:id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get deleted user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Deleted User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findDeleteOne(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: number
  ) {
    try {
      const user = await this.usersService.findDeletedOneuser(id);
      if (!user) return ApiResponses.error(null, 'User not found');
      return ApiResponses.success(user, 'Deleted User retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch user');
    }
  }



  // ** Update user
  @Patch(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    try {
      const updatedUser = await this.usersService.updateUser(id, updateUserDto);
      return ApiResponses.success(updatedUser, 'User updated successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to update user');
    }
  }

  // ** is active for admin 
  @Patch('active/:id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update active status user by ID' })
  @ApiResponse({ status: 200, description: 'User active status updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async activeStatusChange(

    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: number) 
    {
      try {
      const updatedUser = await this.usersService.activeStatusChange(id);
      return ApiResponses.success(updatedUser, 'User active updated successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to update user');
    }
  }
  // ** Soft delete user
  @Delete('soft/:id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete user by ID' })
  @ApiBody({
    schema: {
      properties: {
        ids: { type: 'array', items: { type: 'number' } },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'User soft-deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async softDeleteOne(@Body() dto: { ids: number[] }) {
    try {
      await this.usersService.softDeleteMultiple(dto.ids); // pass array if id
      return ApiResponses.success(null, 'User soft-deleted successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to soft-delete user');
    }
  }


  // ---------------------------------------------
  @Delete('permanent')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete multiple users' })
  @ApiBody({
    schema: {
      properties: {
        ids: { type: 'array', items: { type: 'number' } },
      },
    },
  })
  async permanentDeleteMany(@Body() body: { ids: number[] }) {
    try {
      await this.usersService.deleteMultiple(body.ids);
      return ApiResponses.success(null, 'Users permanently deleted');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to delete users');
    }
  }
  //
  // admin create user 
  @Post('admin/create-user')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create user by admin (Admin only)' })
  async adminCreateUser(@Body() dto: CreateUserDto) {
    try {
      const res = await this.usersService.adminCreateUser(dto);
      return ApiResponses.success(res, 'User created successfully by admin');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

}
