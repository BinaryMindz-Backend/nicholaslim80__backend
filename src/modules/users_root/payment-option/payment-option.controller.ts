import { 
  Controller, Get, Post, Body, Param, Patch, Delete 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ApiResponses } from 'src/common/apiResponse';
import { CreatePaymentMethodDto } from './dto/create-payment-option.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';
import { Auth } from 'src/decorators/auth.decorator';
import { UpdatePaymentMethodDto } from './dto/update-payment-option.dto';
import { PaymentMethodService } from './payment-option.service';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
// import { Roles } from 'src/decorators/roles.decorator';
// import { UserRole } from '@prisma/client';


@ApiTags('Payment Methods (for users)')
@Controller('payment-method')
@RequirePermission(Module.PAYMENT_METHOD, Permission.ALL)
// @Roles(UserRole.USER)
@ApiBearerAuth()
export class PaymentMethodController {
  constructor(private readonly service: PaymentMethodService) {}


  // CREATE
  @Post()
  @Auth()
  // @Roles(UserRole.USER)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a payment method' })
  @ApiResponse({ status: 201, description: 'Payment method created successfully' })
  async create(@Body() dto: CreatePaymentMethodDto, @CurrentUser() user: IUser) {
    try {
      const result = await this.service.create(dto, user);
      return ApiResponses.success(result, 'Payment method created successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Payment method creation failed');
    }
  }

  // FIND ALL
  @Get()
  @Auth()
  // @Roles(UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payment methods for logged-in user' })
  async findAll(@CurrentUser() user: IUser) {
    try {
      const result = await this.service.findAll(user);
      return ApiResponses.success(result, 'Payment methods retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to retrieve payment methods');
    }
  }

  // FIND ONE
  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  // @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Get a payment method by ID' })
  @ApiParam({ name: 'id', description: 'Payment Method ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: IUser) {
    try {
      const result = await this.service.findOne(+id, user);
      return ApiResponses.success(result, 'Payment method retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Payment method not found');
    }
  }

  // UPDATE
  @Patch(':id')
  @Auth()
  @ApiBearerAuth()
  // @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Update a payment method' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
    @CurrentUser() user: IUser,
  ) {
    try {
      const result = await this.service.update(+id, dto, user);
      return ApiResponses.success(result, 'Payment method updated successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to update payment method');
    }
  }

  // DELETE
  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  // @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Delete a payment method' })
  async remove(@Param('id') id: string, @CurrentUser() user: IUser) {
    try {
      const result = await this.service.remove(+id, user);
      return ApiResponses.success(result, 'Payment method deleted successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to delete payment method');
    }
  }
}
