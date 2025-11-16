import { 
  Controller, Get, Patch, Delete, Param, Body, HttpStatus, ParseIntPipe 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ApiResponses } from 'src/common/apiResponse';
import { Auth } from 'src/decorators/auth.decorator';
import { UpdateUserDto } from './dto/update-user.dto';


@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ** Get all verified users
  @Get("/verified")
  @Auth()
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAllUsers() {
    try {
      const users = await this.usersService.findAllUsers();
      return ApiResponses.success(users, 'Users retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch users');
    }
  }


  // ** Get single user
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

  // ** Soft delete user
  @Delete('soft/:id')
  @Auth()
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

}
