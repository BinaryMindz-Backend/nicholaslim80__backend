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


  // GET MY ORDERS
  @Get('mine')
  @Auth()
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get logged-in user orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async findMine(@CurrentUser() user: IUser) {
    try {
      const orders = await this.orderService.findMine(user.id);
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
  @ApiOperation({ summary: 'Get all orders' })
  async findAll() {
    const orders = await this.orderService.findAll();
    return ApiResponses.success(orders, 'All orders retrieved successfully');
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



  // mark as pending
  @Patch(':id/pending')
  @Auth()
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order by ID' })
  async orderMarkAsPending(@Param('id') id: string,@CurrentUser() user:IUser) {
    try {
      const order = await this.orderService.orderMarkAsPending(+id, user);
      return ApiResponses.success(order, 'Order status updated successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to update order status');
    }
  }



  // mark as completed
  @Patch(':id/completed')
  @Roles(UserRole.USER,UserRole.RAIDER, UserRole.SUPER_ADMIN)
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order by ID' })
  async orderMarkAsCompleted(@Param('id') id: string,@CurrentUser() user:IUser) {
    try {
      const order = await this.orderService.orderMarkAsCompleted(+id, user);
      return ApiResponses.success(order, 'Order status updated successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to update order status');
    }
  }

  // mark as cancled
  @Patch(':id/cancled')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order by ID' })
  async orderMarkAsCancled(@Param('id') id: string,@CurrentUser() user:IUser) {
    try {
      const order = await this.orderService.orderMarkAsCancled(+id, user);
      return ApiResponses.success(order, 'Order status updated successfully');
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
}
