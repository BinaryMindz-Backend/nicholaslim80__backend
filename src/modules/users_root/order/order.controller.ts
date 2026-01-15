import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { NotifyRaider, PriorityOrder, UpdateOrderDto } from './dto/update-order.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
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
import { BulkOrderWithDestinationsDto } from './dto/bulk-order-dto';
import { CreateIndiOrderDto } from './dto/create_indivitual_order_dto';
import { RaiderOrdersFilterDto } from './dto/raider-filter.dto';
import { StopType } from '@prisma/client';
import { CancelOrderDto, CompleteStopDto, FailStopDto, PlaceOrderDto } from './dto/place-cancle-order.dto';
import type { Response } from 'express';
import { UpdateOrderDetailsDto } from './dto/update-order-details.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';

@ApiTags('Order (User and admin)')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }


  // CREATE
  @Post()
  @Auth()
  // @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @RequirePermission(Module.ORDER, Permission.CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new order' })
  async create(@Body() dto: CreateOrderDto, @CurrentUser() user: IUser) {
    try {
      const order = await this.orderService.create(dto, user);
      return ApiResponses.success(order, 'Order created successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to create order');
    }
  }


  //
  @Patch(':order_id/destinations/add')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.ORDER, Permission.ADD_DESTINATION_TO_ORDER)
  @ApiOperation({ summary: 'Add destination to order (creates stop)' })
  async addDestinationToOrder(
    @Param('order_id') orderId: string,
    @Query('destination_id') destinationId: string,
    @Query('stop_type') stopType: StopType, // 'PICKUP' or 'DROP'
    @CurrentUser() user: IUser,
  ) {
    try {
      if (!destinationId) {
        return ApiResponses.error(null, 'destination_id is required');
      }

      if (!stopType || !['PICKUP', 'DROP'].includes(stopType)) {
        return ApiResponses.error(null, 'stop_type must be PICKUP or DROP');
      }

      const orderStop = await this.orderService.addDestinationToOrder(
        +orderId,
        +destinationId,
        user.id,
        stopType,
      );

      return ApiResponses.success(orderStop, 'Destination added to order successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to add destination to order');
    }
  }

  // 
  @Delete(':order_id/stops/:stop_id')
  @Auth()
  @ApiBearerAuth()
  // @RequirePermission(Module.ORDER, Permission)
  @ApiOperation({ summary: 'Remove destination from order' })
  async removeDestinationFromOrder(
    @Param('order_id') orderId: string,
    @Param('stop_id') stopId: string,
    @CurrentUser() user: IUser,
  ) {
    try {
      const result = await this.orderService.removeDestinationFromOrder(
        +orderId,
        +stopId,
        user.id,
      );
      return ApiResponses.success(result, 'Destination removed from order successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to remove destination from order');
    }
  }
  // update order details
  @Patch(':order_id/update-details')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.ORDER, Permission.CREATE)
  async updateOrderDetails(
    @Param('order_id', ParseIntPipe) orderId: number,
    @CurrentUser() user: IUser,
    @Body() dto: UpdateOrderDetailsDto,
  ) {
    const order = await this.orderService.updateOrderDetails(orderId, user.id, dto);
    return ApiResponses.success(order, 'Order updated and price recalculated');
  }

  // 
  @Post(':order_id/apply-discount')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.ORDER, Permission.CREATE)
  async applyDiscount(
    @Param('order_id', ParseIntPipe) orderId: number,
    @CurrentUser() user: IUser,
    @Body() dto: ApplyDiscountDto,
  ) {
    const order = await this.orderService.applyDiscount(orderId, user.id, dto);
    return ApiResponses.success(order, 'Discount applied successfully');
  }

  @Delete(':order_id/remove-discount')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.ORDER, Permission.CREATE)
  @ApiOperation({ summary: 'Remove discount from order' })
  @ApiParam({ name: 'order_id', description: 'Order ID', required: true })
  @ApiQuery({ name: 'type', description: 'Discount type', required: true, example: 'coin or promo' })
  async removeDiscount(
    @Query('type') type: string,
    @Param('order_id', ParseIntPipe) orderId: number,
    @CurrentUser() user: IUser,
  ) {
    const order = await this.orderService.removeDiscount(orderId, user.id, type);
    return ApiResponses.success(order, 'Discount removed');
  }


  // PLACE ORDER (Lock & Configure Payment)
  @Post(':order_id/place')
  @Auth()
  @ApiBearerAuth()
  // @RequirePermission(Module.ORDER, Permission.PLACE_ORDER)
  @ApiOperation({ summary: 'Place order (finalize and configure payment)' })
  async placeOrder(
    @Param('order_id') orderId: string,
    @CurrentUser() user: IUser,
    @Body() dto: PlaceOrderDto,
  ) {
    try {
      const order = await this.orderService.placeOrder(+orderId, user.id, dto);
      return ApiResponses.success(order, 'Order placed successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to place order');
    }
  }

  @Post(':order_id/notify-rider')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.ORDER, Permission.CREATE)
  async notifyRider(
    @Param('order_id', ParseIntPipe) orderId: number,
    @CurrentUser() user: IUser,
    @Body() dto: NotifyRaider,
  ) {
    const order = await this.orderService.notifyRider(orderId, user.id, dto);
    return ApiResponses.success(order, 'raider will notified you');
  }

  //  

  @Post(':order_id/priority-order')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.ORDER, Permission.CREATE)
  async priorityOrder(
    @Param('order_id', ParseIntPipe) orderId: number,
    @CurrentUser() user: IUser,
    @Body() dto: PriorityOrder,
  ) {
    const order = await this.orderService.priorityOrder(orderId, user.id, dto);
    return ApiResponses.success(order, 'Priorited your order successfully');
  }


  @Post('stops/:stop_id/complete')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete stop (raider only)' })
  @ApiParam({ name: 'stop_id', description: 'Order Stop ID', example: 201 })
  @ApiResponse({ status: 200, description: 'Stop completed successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient payment or validation error' })
  async completeStop(
    @Param('stop_id', ParseIntPipe) stopId: number,
    @CurrentUser() user: IUser,
    @Body() dto: CompleteStopDto,
  ) {
    try {
      const result = await this.orderService.completeStop(stopId, user.id, {
        proofFiles: dto.proofUrls!,
        codCollected: dto.codCollected ? +dto.codCollected : undefined,
        notes: dto.notes,
      });

      return ApiResponses.success(result, 'Stop completed successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to complete stop');
    }
  }

  // 
  @Post('stops/:stop_id/fail')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark stop as failed (raider only)' })
  @ApiParam({ name: 'stop_id', description: 'Order Stop ID', example: 201 })
  @ApiResponse({ status: 200, description: 'Stop marked as failed' })
  async failStop(
    @Param('stop_id', ParseIntPipe) stopId: number,
    @Body() dto: FailStopDto,
  ) {
    try {
      const result = await this.orderService.failStop(stopId, dto.reason);
      return ApiResponses.success(result, 'Stop marked as failed');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to mark stop as failed');
    }
  }

  // RETRY FAILED STOP
  @Post('stops/:stop_id/retry')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry failed stop' })
  @ApiParam({ name: 'stop_id', description: 'Order Stop ID', example: 201 })
  @ApiResponse({ status: 200, description: 'Stop reset for retry' })
  async retryFailedStop(@Param('stop_id', ParseIntPipe) stopId: number) {
    try {
      const result = await this.orderService.retryFailedStop(stopId);
      return ApiResponses.success(result, 'Stop reset for retry');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to retry stop');
    }
  }


  // CANCEL ORDER
  @Patch(':order_id/cancel')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'order_id', description: 'Order ID', example: 100 })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel order in current status' })
  async cancelOrder(
    @Param('order_id', ParseIntPipe) orderId: number,
    @CurrentUser() user: IUser,
    @Body() dto: CancelOrderDto,
  ) {
    try {
      const result = await this.orderService.cancelOrder(orderId, user.id, dto.reason);
      return ApiResponses.success(result, 'Order cancelled successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to cancel order');
    }
  }

  // create indivitual order
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
      const order = await this.orderService.createIndividualOrder(dto, user);

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
      const res = await this.orderService.bulkCreateOrdersFromCsv(dto, +user.id);
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
    @Query() filter: RaiderOrdersFilterDto,
  ) {
    try {
      const orders = await this.orderService.findMine(
        +user.id,
        filter.page,
        filter.limit,
        filter.status,
      );
      return ApiResponses.success(orders, 'Orders retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to fetch orders');
    }
  }

  // GET MY ORDERS
  @Get('raider/mine')
  @Auth()
  @RequirePermission(Module.ORDER, Permission.ORDER_READ_MINE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get logged-in user orders with optional filter' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async findRaiderMine(
    @CurrentUser() user: IUser,
    @Query() filter: RaiderOrdersFilterDto,
  ) {
    try {
      const orders = await this.orderService.findRaiderMine(
        +user.id,
        filter.page,
        filter.limit,
        filter.status,
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
  async findAllBulk(@Query() dto: PaginationDto, @CurrentUser() user: IUser) {
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
    @CurrentUser() user: IUser
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
    @Param("userId") userId: string, @Query() filterDto: OrderFilterDto) {
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
      const order = await this.orderService.getOrderDetails(+id);
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
  async driverCompitition(@Param('order_id') order_id: string, @CurrentUser() user: IUser) {
    console.log(user, order_id);
    // 
    try {
      const order = await this.orderService.driverCompitition(user, +order_id);
      return ApiResponses.success(order, 'Raider join as compitition driver');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to join as compitition driver');
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


  @Patch('status/:orderId/:userId')
  @Auth()
  @ApiBearerAuth()
  // @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @RequirePermission(Module.ORDER, Permission.UPDATE_ORDER_STATUS)
  @ApiOperation({ summary: 'Update order status' })
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
    @Param('userId') userId: string,
    @CurrentUser() user: IUser
  ) {
    try {
      const updated = await this.orderService.updateOrderStatus(+orderId, +userId, dto, user);
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
  // order decline from feed
  @Post('followed-rider/order/:orderId')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.ORDER, Permission.DECLINE_ORDER)
  @ApiOperation({ summary: 'Followed order (raider only)' })
  async followedRiderOrder(
    @Param('orderId') orderId: string
  ) {

    const result = await this.orderService.followedRiderOrder(Number(orderId));

    return ApiResponses.success(result, 'Followed order successfully');
  }


}
