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
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from 'src/decorators/auth.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ApiResponses } from 'src/common/apiResponse';
import type { IUser } from 'src/types';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PaginationDto } from 'src/utils/dto/pagination.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { UpdateOrderStatusDto } from './dto/updateOrderStatusDto';

@ApiTags('Order (User)')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}


//  TODO:Need to create assign driver by admin


  // CREATE
  @Post()
  @Auth()
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new order' })
  async create(@Body() dto: CreateOrderDto, @CurrentUser() user:IUser) {
    try {
      const order = await this.orderService.create(dto, user);
      return ApiResponses.success(order, 'Order created successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to create order');
    }
  }
  
    // 
    @Get('stats')
    @Auth()
    @Roles(UserRole.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Get order statistics (admin only)" })
    @ApiResponse({ status: 200, description: 'Order stats retrieved successfully' })
    async getOrderStats() {
      try {
        const stats = await this.orderService.getOrderStats();
        return ApiResponses.success(stats, 'Order stats retrieved successfully');
      } catch (err) {
        return ApiResponses.error(err, 'Failed to fetch order stats');
      }
    }


  // GET MY ORDERS
  @Get('mine')
  @Auth()
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get logged-in user orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async findMine(
    @CurrentUser() user: IUser,
    @Query() pagination: PaginationDto,
) {
    try {
      const orders = await this.orderService.findMine(
        +user.id,
        pagination.page,
        pagination.limit,
      );
      return ApiResponses.success(orders, 'Orders retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch orders');
    }
  }


    // GET MY ORDERS
      @Get('user-history/:userId')
      @Auth()
      @Roles(UserRole.SUPER_ADMIN)
      @ApiBearerAuth()
      @ApiOperation({ summary: 'Get logged-in user orders (admin only)' })
      @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
      async findUserOrder(
        @Param("userId") userId: string,
        @Query() pagination: PaginationDto,
      ) {
        try {
          const orders = await this.orderService.findUserOrder(
            +userId,
            pagination.page,
            pagination.limit,
          );
          return ApiResponses.success(orders, 'Orders retrieved successfully');
        } catch (err) {
          return ApiResponses.error(err, 'Failed to fetch orders');
        }
      }


    // GET ALL ORDERS (ADMIN OR SYSTEM USE)
    @Get()
    @Auth()
    @Roles(UserRole.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all orders with filters' })
    async findAll(@Query() filterDto: OrderFilterDto) {
      try {
        const orders = await this.orderService.findAll(filterDto);
        return ApiResponses.success(orders, 'Orders retrieved successfully');
      } catch (err) {
        return ApiResponses.error(err, 'Failed to fetch orders');
      }
    }

   

  // GET ONE
  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @Roles(UserRole.RAIDER, UserRole.SUPER_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get order by ID' })
  async findOne(@Param('id') id: string) {
    try {
      const order = await this.orderService.findOne(+id);
      return ApiResponses.success(order, 'Order retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch order');
    }
  }

  // UPDATE
  @Patch(':id')
  @Auth()
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update order by ID (Admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    try {
      const order = await this.orderService.update(+id, dto);
      return ApiResponses.success(order, 'Order updated successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to update order');
    }
  }

  //
  @Patch(':order_id/destination/update')
  @Auth()
  @ApiBearerAuth()
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Update order by ID (user only)' })
  async destinationUpdateByUser(@Param('order_id') order_id: string, @Query("desti_id") desti_id:string, @CurrentUser() user:IUser ) {
    // 
    try {
      const order = await this.orderService.destinationUpdateByUser(+order_id, +desti_id, user);
      return ApiResponses.success(order, 'Order updated successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to update order');
    }
  } 


@Patch('status/:id/orderId/:userId')
@Auth()
@ApiBearerAuth()
@Roles(UserRole.USER, UserRole.SUPER_ADMIN)
@ApiOperation({ summary: 'Update order status' })
async updateOrderStatus(
  @Param('id') id: string,
  @Body() dto: UpdateOrderStatusDto,
  @Param('userId') userId:string
) {
  try {
    const updated = await this.orderService.updateOrderStatus(+id, +userId, dto);
    return ApiResponses.success(updated, 'Order status updated successfully');
  } catch (err) {
    return ApiResponses.error(err, 'Failed to update order status');
  }
}

  // DELETE
  @Delete(':id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete order by ID(Admin only)' })
  async remove(@Param('id') id: string) {
    try {
      const order = await this.orderService.remove(+id);
      return ApiResponses.success(order, 'Order deleted successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to delete order');
    }
  }

  // 
  @Patch('assign/driver/:id')
  @Auth()
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Assign driver by order ID (admin only)" })
  async assignDriver(
    @Param('id') id: string,
    @Query('riderId') riderId: string,
  ) {
    try {
      const updated = await this.orderService.assignDriver(+id, +riderId);
      return ApiResponses.success(updated, 'Assign driver successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to assign a driver');
    }
  }
  


}
