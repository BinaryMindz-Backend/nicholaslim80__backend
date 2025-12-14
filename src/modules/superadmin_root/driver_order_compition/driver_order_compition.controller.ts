import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
  Post,
  Query,
  ParseIntPipe,
  HttpStatus,
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
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';
import { DateByFilterDto } from './dto/date-by-filter.dto';





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

    // GET ALL Logs
  @Get("logs")
  @Auth()
  @RequirePermission(Module.DRIVER_ORDER_COMPETITION, Permission.READ)
  @ApiOperation({ summary: 'Get all competition configurations changes logs (Admin only)' })
  @ApiResponse({ status: 200, description: 'Configurations changes logs fetched successfully' })
  // @ApiQuery({ type: DateByFilterDto })
  async findAllLogs(@Query() filterDto:DateByFilterDto) {
    //  
    try {
      const res = await this.service.findAllLogs(filterDto.date);
      return ApiResponses.success(res, 'Configurations changes logs fetched successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch configurations changes logs ');
    }
  }

  // GET ONE
  @Get(':id')
  @Auth()
  @RequirePermission(Module.DRIVER_ORDER_COMPETITION, Permission.READ)
  @ApiOperation({ summary: 'Get competition configuration by ID' })
  @ApiParam({ name: 'id', example: 1 })
  async findOne(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: string,
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
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: string,
    @Body() dto: UpdateDriverOrderCompitionDto,
    @CurrentUser() user:IUser, 
  ) {
    try {
      const res = await this.service.update(+id, dto, user);
      return ApiResponses.success(res, 'Configuration updated successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Update failed');
    }
  }
// closing bracket
}
