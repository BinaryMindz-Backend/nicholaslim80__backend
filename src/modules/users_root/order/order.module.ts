import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TransactionIdService } from 'src/common/services/transaction-id.service';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { CompetitionWorker } from 'src/core/workers/competition.worker';
import { ServiceZoneService } from 'src/modules/superadmin_root/service-zone/service-zone.service';

@Module({
  imports:[RedisModule],
  controllers: [OrderController],
  providers: [OrderService, TransactionIdService, CompetitionWorker, ServiceZoneService],
})
export class OrderModule {}
