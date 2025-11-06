import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ApiResponses } from 'src/common/apiResponse';



@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
   
  // Create an users
  @Post('create')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully'})
  async createUser(@Body() createUserDto: CreateUserDto) {
        try {
        const user = await this.usersService.createUser(createUserDto);
          return ApiResponses.success(user, "User Created Successfully")
        } catch (err) {
          return ApiResponses.error(err, 'Failed to fetch user');
        }
  }
  

  // get all users
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async findAllUsers() {
     try {
        const users = await this.usersService.findAllUsers();
         return  ApiResponses.success(users, "Retrived all users successfully")
     } catch (err) {
        return ApiResponses.error(err, 'Failed to fetch user');
     }


  }
   
  // ** get single user
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully'})
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOneuser(@Param('id', new ParseIntPipe({errorHttpStatusCode:HttpStatus.NOT_ACCEPTABLE})) id: string) {
      try {
          const user = await this.usersService.findOneuser(Number(id))
             if(!user){
                return ApiResponses.error(null, "User Not Found")
             }
            return ApiResponses.success(user, "User Retrived Successfully")

      } catch (err) {
           return ApiResponses.error(err, 'Failed to fetch user');
      }
  }
  

  // 
  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully'})
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully'})
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
