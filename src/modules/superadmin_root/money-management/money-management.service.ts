import { Injectable } from '@nestjs/common';
import { CreateMoneyManagementDto } from './dto/create-money-management.dto';
import { UpdateMoneyManagementDto } from './dto/update-money-management.dto';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class MoneyManagementService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }
  async paymentAndTransactions() {
    const allorders = await this.prisma.order.findMany({});
    const allorderDetailsInformation = await this.prisma.order.findMany({
      select: {
        id: true,
        order_status: true,
        total_cost: true,
        created_at: true,

      }
    });
    console.log({ allorderDetailsInformation });

    const data = {
      order: allorders.length,
      progressOrders: allorders.filter(o => o.order_status === 'PROGRESS').length,
    }
    console.log(data);
    return allorders;
  }

  findAll() {
    return `This action returns all moneyManagement`;
  }

  findOne(id: number) {
    return `This action returns a #${id} moneyManagement`;
  }

  update(id: number, updateMoneyManagementDto: UpdateMoneyManagementDto) {
    return `This action updates a #${id} moneyManagement`;
  }

  remove(id: number) {
    return `This action removes a #${id} moneyManagement`;
  }
}
