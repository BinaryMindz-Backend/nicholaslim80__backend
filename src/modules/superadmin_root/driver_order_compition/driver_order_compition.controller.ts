import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ApiResponses } from 'src/common/apiResponse';
import { DriverCompetitionService } from './driver_order_compition.service';
import { UpdateDriverOrderCompitionDto } from './dto/update-driver_order_compition.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { CreateDriverCompetitionDto } from './dto/create-driver_order_compition.dto';





@ApiTags('Driver Order Competition')
@ApiBearerAuth()
@Controller('driver-order-competition')
export class DriverCompetitionController {
  constructor(private readonly service: DriverCompetitionService) {}

  @Post()
  @Auth()
  @RequirePermission(Module.DRIVER_ORDER_COMPETITION, Permission.CREATE)
  @ApiBody({ type: CreateDriverCompetitionDto })
  @ApiOperation({ summary: 'Create competition configurations (Admin only testing)' })
  @ApiResponse({ status: 200, description: 'Configurations Created successfully' })
  async create(@Body()
         dto:CreateDriverCompetitionDto) {
      // 
    try {
      const res = await this.service.create(dto);
      return ApiResponses.success(res, 'Configurations Created successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to Created configurations');
    }
  }


  // GET ALL
  @Get()
  @Auth()
  @RequirePermission(Module.DRIVER_ORDER_COMPETITION, Permission.READ)
  @ApiOperation({ summary: 'Get all competition configurations (Admin only)' })
  @ApiResponse({ status: 200, description: 'Configurations fetched successfully' })
  async findAll() {
    try {
      const res = await this.service.findAll();
      return ApiResponses.success(res, 'Configurations fetched successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch configurations');
    }
  }

  // GET ONE
  @Get(':id')
  @Auth()
  @RequirePermission(Module.DRIVER_ORDER_COMPETITION, Permission.READ)
  @ApiOperation({ summary: 'Get competition configuration by ID' })
  @ApiParam({ name: 'id', example: 1 })
  async findOne(
    @Param('id') id: string,
  ) {
    try {
      const res = await this.service.findOne(+id);
      return ApiResponses.success(res, 'Configuration fetched successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch configuration');
    }
  }

  // UPDATE
  @Patch(':id')
  @Auth()
  @RequirePermission(Module.DRIVER_ORDER_COMPETITION, Permission.UPDATE)
  @ApiOperation({ summary: 'Update competition configuration (Admin only)' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiParam({ name: 'id', example: 1 })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDriverOrderCompitionDto,
  ) {
    try {
      const res = await this.service.update(+id, dto);
      return ApiResponses.success(res, 'Configuration updated successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Update failed');
    }
  }

  // DELETE
  @Delete(':id')
  @Auth()
  @RequirePermission(Module.DRIVER_ORDER_COMPETITION, Permission.DELETE)
  @ApiOperation({ summary: 'Delete competition configuration (Admin only)' })
  @ApiParam({ name: 'id', example: 1 })
  async remove(
    @Param('id') id: string,
  ) {
    try {
      const res = await this.service.remove(+id);
      return ApiResponses.success(res, 'Configuration deleted successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Deletion failed');
    }
  }
}
