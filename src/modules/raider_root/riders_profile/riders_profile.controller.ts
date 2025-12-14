import { Controller, Get, Post, Body, Patch, Param, Query, Delete, } from '@nestjs/common';
import { RidersProfileService } from './riders_profile.service';
import { CreateRidersProfileDto } from './dto/create-riders_profile.dto';
import { UpdateRidersProfileDto } from './dto/update-riders_profile.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiResponses } from 'src/common/apiResponse';
import { RaiderVerification } from '@prisma/client';
import { GetRidersQueryDto } from './dto/query-riders.dto';
import { SuspendRiderProfileDto } from './dto/suspendRider.dto';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';



@ApiTags("riders and raider profile")
@Controller('raider-profile')
export class RidersProfileController {
  constructor(private readonly ridersProfileService: RidersProfileService) { }

  @Post('raider-registration')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN, UserRole.RAIDER)
  @RequirePermission(Module.RAIDER, Permission.CREATE)
  @ApiOperation({ summary: 'Rider profile creation (Rider only)' })
  @ApiBody({ type: CreateRidersProfileDto })
  @ApiBearerAuth()
  async create(@Body() createRidersProfileDto: CreateRidersProfileDto,
    @CurrentUser() user: IUser,
  ) {
    try {
      const res = await this.ridersProfileService.create(user.id, createRidersProfileDto);
      return ApiResponses.success(res, 'Rider profile created successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }


  @Get('rider-profiles')
  @ApiOperation({ summary: 'Rider profiles fetching (Admin only)' })
  @Auth()
  @RequirePermission(Module.RAIDER, Permission.JUST_ADMIN)
  // @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  async findAll(@Query() query: GetRidersQueryDto) {
    try {
      const res = await this.ridersProfileService.findAll(query);
      return ApiResponses.success(res, 'Rider profiles fetched successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }
  // 
  // @Get('rider-profiles/new-joinee')
  // @ApiOperation({ summary: 'Rider profiles fetching (Admin only)' })
  // @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  // @ApiBearerAuth()
  // async findAll(@Query() query: GetRidersQueryDto) {
  //   try {
  //     const res = await this.ridersProfileService.findAll(query);
  //     return ApiResponses.success(res, 'Rider profiles fetched successfully');
  //   } catch (error) {
  //     return ApiResponses.error(error);
  //   }
  // }
  


  @Get(':id')
  @ApiOperation({ summary: 'Rider profile fetching by id (Admin only)' })
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RAIDER, Permission.READ)
  // @Roles(UserRole.SUPER_ADMIN, UserRole.RAIDER)
  async findOne(@Param('id') id: string) {
    try {
      const res = await this.ridersProfileService.findOne(id);
      return ApiResponses.success(res, 'Rider profile fetched successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Patch('verify-rider/:raiderId/:verify')
  @Auth()
  @RequirePermission(Module.RAIDER, Permission.JUST_ADMIN)
  // @Roles(UserRole.SUPER_ADMIN)
  @ApiParam({
    name: 'verify',
    enum: RaiderVerification,
    description: 'Verification status',
    required: true,
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify rider profile (Admin only)' })
  async verifyRiderProfile(@Param('raiderId') raiderId: string, @Param('verify') verify: RaiderVerification) {
    try {
      const res = await this.ridersProfileService.verifyRiderProfile(Number(raiderId), verify);
      return ApiResponses.success(res, 'Rider profile verified successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }


  // 
  @Patch('update-rider-profile')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN, UserRole.RAIDER)
  @RequirePermission(Module.RAIDER, Permission.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update rider profile (Rider only)' })
  async update(@Body() updateRidersProfileDto: UpdateRidersProfileDto, @CurrentUser() user: IUser) {
    try {
      const res = await this.ridersProfileService.update(user.id, updateRidersProfileDto);
      return ApiResponses.success(res, 'Rider profile updated successfully');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Delete(':userId')
  @Auth()
  @ApiBearerAuth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.RAIDER, Permission.DELETE)
  @ApiOperation({ summary: 'Delete rider profile by id (Admin only)' })
  async remove(@Param('userId') userId: string) {
    try {
      const res = await this.ridersProfileService.remove(+userId);
      return ApiResponses.success(res, 'Rider profile deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return ApiResponses.error(message);
    }
  }
  @Patch('suspend/:id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.RAIDER, Permission.JUST_ADMIN)
  // @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspend rider profile by id (Admin only)' })
  async Suspend(@Param('id') id: string, @Body() suspendRiderProfileDto: SuspendRiderProfileDto) {
    try {
      const res = await this.ridersProfileService.suspendRiderProfile(Number(id), suspendRiderProfileDto);
      return ApiResponses.success(res, 'Rider profile suspended successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return ApiResponses.error(message);
    }
  }

  @Patch('unsuspend/:id')
  @Auth()
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Unsuspend rider profile by id (Admin only)' })
  async Unsuspend(@Param('id') id: string) {
    try {
      const res = await this.ridersProfileService.unsuspendRiderProfile(Number(id));
      return ApiResponses.success(res, 'Rider profile unsuspended successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return ApiResponses.error(message);
    }
  }




  // create rider profile by admin 
  @Post('admin/create-rider')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.RAIDER, Permission.JUST_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create rider profile for a user (Admin only)' })
  async adminCreateRiderProfile(
    @Body() createRidersProfileDto: CreateRidersProfileDto,
  ) {
    try {
      const res = await this.ridersProfileService.adminCreateRiderProfile(createRidersProfileDto);
      return ApiResponses.success(res, 'Rider profile created successfully by admin');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  // admin update rider profile
  @Patch('admin/update-rider/:id')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.RAIDER, Permission.JUST_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update rider profile by admin (Admin only)' })
  async adminUpdateRiderProfile(
    @Param('id') id: number,
    @Body() updateRidersProfileDto: UpdateRidersProfileDto,
  ) {
    try {
      const res = await this.ridersProfileService.adminUpdateRiderProfile(id, updateRidersProfileDto);
      return ApiResponses.success(res, 'Rider profile updated successfully by admin');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }
}
