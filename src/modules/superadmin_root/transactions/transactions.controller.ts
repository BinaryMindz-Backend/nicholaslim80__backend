import { Controller, Get, Param, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiResponses } from 'src/common/apiResponse';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { transactionFilterDto } from './dto/filter-pagination.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  // GET ALL
  @Get()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.PAYMENT_TRANSACTION, Permission.READ)
  @ApiOperation({ summary: 'Get all transaction records' })
  @ApiResponse({ status: 200, description: 'Transactions data fetched successfully' })
  async findAll(@Query() filterDto: transactionFilterDto) {
    try {
      const res = await this.transactionsService.findAll(filterDto);
      return ApiResponses.success(res, 'Transactions data fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Transactions data fleet tracking list');
    }
  }

  // 
  // GET ONE
  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.PAYMENT_TRANSACTION, Permission.READ)
  @ApiOperation({ summary: 'Get single transaction records' })
  @ApiResponse({ status: 200, description: 'Transactions data fetched successfully' })
  async findOne(@Param('id') id: string) {
    try {
      const res = await this.transactionsService.findOne(+id);
      return ApiResponses.success(res, 'Transactions data fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Transactions data fleet tracking list');
    }
  }



}
