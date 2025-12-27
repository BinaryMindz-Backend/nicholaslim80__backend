import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
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
import { PaginationDto } from 'src/utils/dto/pagination.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { UpdateOrderStatusDto, UpdatePendingOrdersDto } from './dto/updateOrderStatusDto';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import type { Response } from 'express';
import { BulkOrderWithDestinationsDto } from './dto/bulk-order-dto';
import { CreateIndiOrderDto } from './dto/create_indivitual_order_dto';

@ApiTags('Order (User and admin)')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}


  // CREATE
  @Post()
  @Auth()
  // @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @RequirePermission(Module.ORDER, Permission.CREATE)
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
    @Post('indivitual')
    @Auth()
    @RequirePermission(Module.ORDER, Permission.CREATE)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create new order' })
    async createIndivitual(
      @Body() dto: CreateIndiOrderDto,
      @CurrentUser() user: IUser,
    ) {
      try {
        const order = await this.orderService.createOrder(dto, user);

        return ApiResponses.success(order, 'Order created successfully');
      } catch (err: any) {
        const message =
          err?.response?.message ||
          err?.message ||
          'Failed to create order';

        const statusCode =
          err?.status ||
          err?.response?.statusCode ||
          500;

        return ApiResponses.error(message, statusCode);
      }
    }


  // create bulk order
  @Post('orders/bulk')
    @Auth()
    @ApiBearerAuth()
    @RequirePermission(Module.ORDER_PLACEMENT, Permission.JUST_ADMIN)
    @ApiOperation({ summary: 'Create multiple orders from CSV file URL' })
    @ApiResponse({
      status: 200,
      description: 'Bulk orders created successfully',
      schema: {
        example: {
          success: true,
          message: 'Bulk Order Created Successfully',
          data: {
            total_uploaded: 10,
            success: 10,
          },
        },
      },
    })
    @ApiResponse({
      status: 400,
      description: 'Invalid CSV file URL or format',
      schema: {
        example: {
          success: false,
          message: 'Failed to create order',
          error: 'Invalid file URL',
        },
      },
    })
    async bulkCreateFromCsv(
      @Body() dto: BulkOrderWithDestinationsDto,
      @CurrentUser() user: IUser,
    ) {
      try {
        const res = await this.orderService.bulkCreateOrdersFromCsv(dto, user);
        return ApiResponses.success(res, "Bulk Order Created Successfully");
      } catch (error) {
        return ApiResponses.error(error, 'Failed to create order');
      }
    }

  // export as csv
    @Get('orders/export/csv')
    @Auth()
    @ApiBearerAuth()
    @RequirePermission(Module.ORDER_PLACEMENT, Permission.JUST_ADMIN)
    async exportOrders(@Res() res: Response) {
      const csv = await this.orderService.exportOrdersAsCsv();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="orders.csv"',
      );

      res.status(200).send(csv);
    }

  
    // 
    @Get('stats')
    @Auth()
    // @Roles( UserRole.SUPER_ADMIN)
    @RequirePermission(Module.ORDER, Permission.READ)
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
  // @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @RequirePermission(Module.ORDER, Permission.ORDER_READ_MINE)
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
    //find all bulk
    @Get('bulk')
    @Auth()
    // @Roles(UserRole.SUPER_ADMIN)
    @RequirePermission(Module.ORDER, Permission.READ)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all bulk orders with filters' })
    async findAllBulk(@Query() dto: PaginationDto , @CurrentUser() user:IUser) {
      try {
        const orders = await this.orderService.findAllBulk(dto, user);
        return ApiResponses.success(orders, 'All bulk Orders retrieved successfully');
      } catch (err) {
        return ApiResponses.error(err, 'Failed to fetch orders');
      }
    }


    // GET FOR FEED
    @Get('feed')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get Order feed' })
    @ApiResponse({ status: 200, description: 'Orders feed retrieved successfully' })
    async orderForFeed(
      @Query() pagination: PaginationDto,
      @CurrentUser() user:IUser
  ) {
      try {
        const orders = await this.orderService.orderForFeed(
          user.id,
          pagination.page,
          pagination.limit,
        );
        return ApiResponses.success(orders, 'Orders feed retrieved successfully');
      } catch (err) {
        return ApiResponses.error(err, 'Failed to fetch orders');
      }
    }



    // GET MY ORDERS
      @Get('user-history/:userId')
      @Auth()
      // @Roles( UserRole.SUPER_ADMIN)
      @RequirePermission(Module.ORDER, Permission.READ)
      @ApiBearerAuth()
      @ApiOperation({ summary: 'Get logged-in user orders (admin only)' })
      @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
      async findUserOrder(
        @Param("userId") userId: string, @Query() filterDto:OrderFilterDto) {
        try {
          const orders = await this.orderService.findUserOrder(
            +userId,
             filterDto
          );
          return ApiResponses.success(orders, 'Orders retrieved successfully');
        } catch (err) {
          return ApiResponses.error(err, 'Failed to fetch orders');
        }
      }


    // GET ALL ORDERS (ADMIN OR SYSTEM USE)
    @Get()
    @Auth()
    // @Roles(UserRole.SUPER_ADMIN)
    @RequirePermission(Module.ORDER, Permission.READ)
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
  // @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @RequirePermission(Module.ORDER, Permission.GET_ORDER_DETAILS)
  @ApiOperation({ summary: 'Get order by ID' })
  async findOne(@Param('id') id: string) {
    try {
      const order = await this.orderService.findOne(+id);
      return ApiResponses.success(order, 'Order retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch order');
    }
  }

    //
  @Post('driver/compitition/:order_id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.ORDER, Permission.ORDER_COMPITITION)
  @ApiOperation({ summary: 'driver compitition on order by raider ID (raider only)' })
  async driverCompitition(@Param('order_id') order_id: string, @CurrentUser() user:IUser ) {
    console.log(user, order_id);
    // 
    try {
      const order = await this.orderService.driverCompitition(user, +order_id);
      return ApiResponses.success(order, 'Order updated successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to update order');
    }
  } 



  // UPDATE
  @Patch(':id')
  @Auth()
  @ApiBearerAuth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.ORDER, Permission.UPDATE)
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
    // @Roles(UserRole.USER)
    @RequirePermission(Module.ORDER, Permission.ADD_DESTINATION_TO_ORDER)
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
      //  
      @Patch('bulk/status/pending')
      @Auth()
      @RequirePermission(Module.ORDER, Permission.UPDATE)
      @ApiBearerAuth()
      @ApiOperation({ summary: 'Mark multiple orders as PENDING' })
      async markPending(
        @Body() dto: UpdatePendingOrdersDto,
        @CurrentUser() user: IUser,
      ) {
        try {
          const res = await this.orderService.markOrdersAsPending(
            user.id,
            dto,
          );
          return ApiResponses.success(res, 'Orders marked as PENDING');
        } catch (err) {
          return ApiResponses.error(err.message);
        }
      }


    @Patch('status/:id/orderId/:userId')
    @Auth()
    @ApiBearerAuth()
    // @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
    @RequirePermission(Module.ORDER, Permission.UPDATE_ORDER_STATUS)
    @ApiOperation({ summary: 'Update order status' })
    async updateOrderStatus(
      @Param('id') id: string,
      @Body() dto: UpdateOrderStatusDto,
      @Param('userId') userId:string ,
      @CurrentUser() user:IUser
    ) {
      try {
        const updated = await this.orderService.updateOrderStatus(+id, +userId, dto, user);
        return ApiResponses.success(updated, 'Order status updated successfully');
      } catch (err) {
        return ApiResponses.error(err, 'Failed to update order status');
      }
    }

  // DELETE
  @Delete(':id')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.ORDER, Permission.DELETE) 
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
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.ORDER, Permission.UPDATE)
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
    // order decline from feed
    @Patch('decline/:orderId')
    @Auth()
    @ApiBearerAuth()
    @RequirePermission(Module.ORDER, Permission.DECLINE_ORDER)
    @ApiOperation({ summary: 'Decline order (raider only)' })
    async declineOrder(
      @Param('orderId') orderId: string,
      @CurrentUser() user: IUser,
    ) {
      const raiderId = user.id;

      const result = await this.orderService.declineOrder(
        Number(orderId),
        raiderId,
      );

      return ApiResponses.success(result, 'Order declined successfully');
    }
// 

}
