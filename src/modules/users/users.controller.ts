import { 
  Controller, Get, Post, Patch, Delete, Param, Body, HttpStatus, ParseIntPipe 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiResponses } from 'src/common/apiResponse';


@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ** Create new user
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.usersService.createUser(createUserDto);
      return ApiResponses.success(user, 'User created successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to create user');
    }
  }

  // ** Get all users
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll() {
    try {
      const users = await this.usersService.findAllUsers();
      return ApiResponses.success(users, 'Users retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch users');
    }
  }

  // ** Get single user
  @Get(':id')
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

  // ** Update user
  @Patch(':id')
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
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete user by ID' })
  @ApiResponse({ status: 200, description: 'User soft-deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: number
  ) {
    try {
      await this.usersService.removeUser(id);
      return ApiResponses.success(null, 'User soft-deleted successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to delete user');
    }
  }

  // ** TODO: Add routes for token verification, auth, etc.
}
