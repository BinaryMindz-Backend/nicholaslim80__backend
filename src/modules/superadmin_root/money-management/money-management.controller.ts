import { Controller, Get, Body, Patch, Param, Delete } from '@nestjs/common';
import { MoneyManagementService } from './money-management.service';
import { CreateMoneyManagementDto } from './dto/create-money-management.dto';
import { UpdateMoneyManagementDto } from './dto/update-money-management.dto';

@Controller('money-management')
export class MoneyManagementController {
  constructor(private readonly moneyManagementService: MoneyManagementService) { }

  @Get("paymentAndTransactions")
  async paymentAndTransactions() {
    return await this.moneyManagementService.paymentAndTransactions();
  }

  @Get()
  findAll() {
    return this.moneyManagementService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moneyManagementService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMoneyManagementDto: UpdateMoneyManagementDto) {
    return this.moneyManagementService.update(+id, updateMoneyManagementDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.moneyManagementService.remove(+id);
  }
}
