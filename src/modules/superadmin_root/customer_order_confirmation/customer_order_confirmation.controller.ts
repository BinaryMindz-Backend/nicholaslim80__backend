import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ApiResponses } from 'src/common/apiResponse';
import { CustomerOrderConfirmationService } from './customer_order_confirmation.service';
import { Auth } from 'src/decorators/auth.decorator';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { CreateCustomerOrderConfirmationDto } from './dto/create-customer_order_confirmation.dto';
import { UpdateCustomerOrderConfirmationDto } from './dto/update-customer_order_confirmation.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';
import { DateByFilterDto } from './dto/date-filter.dto';




@ApiTags('Customer Order Confirmation (admin only)')
@ApiBearerAuth()
@Controller('customer-order-confirmation')
export class CustomerOrderConfirmationController {
  constructor(private readonly service: CustomerOrderConfirmationService) {}

  // CREATE
  @Post()
  @Auth()
  @RequirePermission(Module.CUSTOMER_ORDER_CONFIRMATION, Permission.CREATE)
  @ApiOperation({ summary: 'Create order confirmation configuration (admin demo use only)' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() dto: CreateCustomerOrderConfirmationDto,
  ) {
    try {
      const res = await this.service.create(dto);
      return ApiResponses.success(res, 'Configuration created successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Creation failed');
    }
  }

  // FIND ALL
  @Get()
  @Auth()
  @RequirePermission(Module.CUSTOMER_ORDER_CONFIRMATION, Permission.READ)
  @ApiOperation({ summary: 'Get all order confirmation configurations' })
  async findAll() {
    try {
      const res = await this.service.findAll();
      return ApiResponses.success(res, 'Configurations fetched successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Fetch failed');
    }
  }
  // find all stats 
  @Get("stats")
  @Auth()
  @RequirePermission(Module.CUSTOMER_ORDER_CONFIRMATION, Permission.READ)
  @ApiOperation({ summary: 'Get all order confirmation configurations stats' })
  async findConfirmationRatioStats() {
    try {
      const res = await this.service.findConfirmationRatioStats();
      return ApiResponses.success(res, 'Configurations configurations stats fetched successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Fetch failed');
    }
  }
  //  
  @Get('logs')
  @Auth()
  @RequirePermission(Module.CUSTOMER_ORDER_CONFIRMATION, Permission.READ)
  @ApiOperation({
    summary: 'Get all customer order confirmation configuration change logs (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer order confirmation logs fetched successfully',
  })
  async findAllLogs(@Query() filterDto: DateByFilterDto) {
    try {
      const res = await this.service.findAllLogs(filterDto);

      return ApiResponses.success(
        res,
        'Customer order confirmation logs fetched successfully',
      );
    } catch (err) {
      return ApiResponses.error(
        err,
        'Failed to fetch customer order confirmation logs',
      );
    }
  }

  // FIND ONE
  @Get(':id')
  @Auth()
  @RequirePermission(Module.CUSTOMER_ORDER_CONFIRMATION, Permission.READ)
  @ApiOperation({ summary: 'Get order confirmation configuration by ID' })
  @ApiParam({ name: 'id', example: 1 })
  async findOne(
    @Param('id', new ParseIntPipe({errorHttpStatusCode:HttpStatus.NOT_ACCEPTABLE})) id: string,
  ) {
    try {
      const res = await this.service.findOne(+id);
      return ApiResponses.success(res, 'Configuration fetched successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Fetch failed');
    }
  }

  // UPDATE
  @Patch(':id')
  @Auth()
  @RequirePermission(Module.CUSTOMER_ORDER_CONFIRMATION, Permission.UPDATE)
  @ApiOperation({ summary: 'Update order confirmation configuration' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiParam({ name: 'id', example: 1 })
  async update(
    @Param('id', new ParseIntPipe({errorHttpStatusCode:HttpStatus.NOT_ACCEPTABLE})) id: string,
    @Body() dto: UpdateCustomerOrderConfirmationDto,
    @CurrentUser() user:IUser
  ) {
    try {
      const res = await this.service.update(+id, dto, user.roles[0].name, user.id);
      return ApiResponses.success(res, 'Configuration updated successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Update failed');
    }
  }
  // The end
}
