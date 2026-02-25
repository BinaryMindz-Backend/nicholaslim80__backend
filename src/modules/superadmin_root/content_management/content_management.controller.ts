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
import { ContentManagementService } from './content_management.service';
import { CreateContentManagementDto } from './dto/create-content_management.dto';
import { UpdateContentManagementDto } from './dto/update-content_management.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { Public } from 'src/decorators/public.decorator';
import { DateByFilterDto } from '../customer_order_confirmation/dto/date-filter.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';




@Controller('content-management')
export class ContentManagementController {
  constructor(
    private readonly contentManagementService: ContentManagementService,
  ) { }

  @Post()
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.CONTENT_MANAGEMENT, Permission.CREATE)
  @ApiBearerAuth()
  async create(@Body() createContentManagementDto: CreateContentManagementDto, @CurrentUser() user:IUser) {
    try {
      const data = await this.contentManagementService.create(
        createContentManagementDto,
        user.roles[0].name,
        user.id
      );
      return ApiResponses.success(
        data,
        ` ${createContentManagementDto.contenttype} content create successfully `,
      );
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Get()
  @Auth()
  @Public()
  async findAll() {
    try {
      const res = await this.contentManagementService.findAll();
      return ApiResponses.success(
        res,
        'All content management fetched successfully',
      );
    } catch (error) {
      return ApiResponses.error(error);
    }
  }
  // 
  @Get('logs')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.CONTENT_MANAGEMENT, Permission.READ)
  @ApiOperation({
    summary: 'Get all content management configuration change logs (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Content management logs fetched successfully',
  })
  async findAllLogs(@Query() filterDto: DateByFilterDto) {
    try {
      const res = await this.contentManagementService.findAllLogs(
        filterDto.fromDate,
        filterDto.toDate,
      );

      return ApiResponses.success(
        res,
        'Content management logs fetched successfully',
      );
    } catch (err) {
      return ApiResponses.error(
        err,
        'Failed to fetch content management logs',
      );
    }
  }


  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    try {
      const res = await this.contentManagementService.findOne(+id);
      return ApiResponses.success(
        res,
        `${id} content details fetch successfully`,
      );
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Patch(':id')
  @Auth()
  @RequirePermission(Module.CONTENT_MANAGEMENT, Permission.UPDATE)
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body() updateContentManagementDto: UpdateContentManagementDto,
    @CurrentUser() user:IUser
  ) {
    try {
      const res = await this.contentManagementService.update(
        +id,
        updateContentManagementDto,
        user.roles[0].name,
        user.id
      );
      return ApiResponses.success(
        res,
        `${id} content update fetch successfully`,
      );
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Delete(':id')
  @Auth()
  @RequirePermission(Module.CONTENT_MANAGEMENT, Permission.DELETE)
  @ApiBearerAuth()
  async remove(@Param('id') id: string, @CurrentUser() user:IUser) {
    try {
      await this.contentManagementService.remove(+id, user.roles[0].name, user.id );
      return ApiResponses.success(null, `${id} content deleted successfully`);
    } catch (error) {
      return ApiResponses.error(error);
    }
  }
}
