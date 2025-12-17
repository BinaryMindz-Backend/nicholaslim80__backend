import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class TransactionsService {
constructor(private readonly prisma: PrismaService) { }

 async findAll() {
      // 
    const res = await this.prisma.transaction.findMany({})
    return res
  }

}
