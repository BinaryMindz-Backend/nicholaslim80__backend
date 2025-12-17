import { Controller, Get} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiResponses } from 'src/common/apiResponse';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // GET ALL
  @Get()
  @Auth()
  @ApiBearerAuth()
  // @RequirePermission(Module.LIVE_MAP, Permission.READ)
  @ApiOperation({ summary: 'Get all transaction records' })
  @ApiResponse({ status: 200, description: 'Transactions data fetched successfully' })
  async findAll() {
    try {
      const res = await this.transactionsService.findAll();
      return ApiResponses.success(res, 'Transactions data fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Transactions data fleet tracking list');
    }
  }


}
