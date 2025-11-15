import { Module } from '@nestjs/common';
import { DeliveryTypeService } from './delivery-type.service';
import { DeliveryTypeController } from './delivery-type.controller';
import { PrismaService } from 'src/core/database/prisma.service';


@Module({
  controllers: [DeliveryTypeController],
  providers: [
    DeliveryTypeService,
    PrismaService,
  ],
  exports: [DeliveryTypeService],
})
export class DeliveryTypeModule {}
