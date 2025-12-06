// my-raider.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MyRaiderService } from './my_raider.service';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/decorators/roles.decorator';
import { Auth } from 'src/decorators/auth.decorator';
import { CreateMyRaiderDto } from './dto/create-my_raider.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { UpdateMyRaiderDto } from './dto/update-my_raider.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';
import { PaginationDto } from 'src/utils/dto/pagination.dto';

@ApiTags('My Raiders (User & admin Only)')
@Controller('my-raider')
export class MyRaiderController {
  constructor(private readonly myRaiderService: MyRaiderService) {}

  @Post()
  @Auth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create my raider entry(user)' })
  @ApiResponse({ status: 201, description: 'My Raider created successfully' })
  async create(@Body() dto: CreateMyRaiderDto, @CurrentUser() user:IUser) {
    try {
      const data = await this.myRaiderService.create(dto,user);
      return ApiResponses.success(data, 'My Raider created successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to create My Raider');
    }
  }
  
  // for admin
  @Get('admin/:userID')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all my raiders for admin(admin) on fav driver' })
  async findAllforAdmin(@Param("userID") id:string) {
    try {
      const data = await this.myRaiderService.findAllforAdmin(+id);
      return ApiResponses.success(data, 'My Raiders fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch My Raiders');
    }
  }
  // for user
  @Get('/my-raider')
  @Auth()
  @Roles(UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all my raiders (user)' })
  // @ApiQuery({type:PaginationDto})
  async findAll(@CurrentUser() user:IUser, @Query() dto:PaginationDto) {
    try {
      const data = await this.myRaiderService.findAll(+user.id, dto);
      return ApiResponses.success(data, 'My Raiders fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch My Raiders');
    }
  }
  // 

  @Get(':id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get single my raider by ID' })
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.myRaiderService.findOne(+id);
      return ApiResponses.success(data, 'My Raider fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch My Raider');
    }
  }

  @Patch(':id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my raider' })
  async update(@Param('id') id: string, @Body() dto: UpdateMyRaiderDto) {
    try {
      const data = await this.myRaiderService.update(+id, dto);
      return ApiResponses.success(data, 'My Raider updated successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to update My Raider');
    }
  }

  // 
  @Patch('makefav/:id')
  @Auth()
  @Roles( UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Make is fav to raider my raider' })
  async isFavourite(@Param('id') id: string) {
    try {
      const data = await this.myRaiderService.isFavourite(+id);
      return ApiResponses.success(data, 'My Raider added to fav successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to added to fav My Raider');
    }
  }



  @Delete(':id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete my raider' })
  async remove(@Param('id') id: string) {
    try {
      const data = await this.myRaiderService.remove(+id);
      return ApiResponses.success(data, 'My Raider deleted successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to delete My Raider');
    }
  }
}
