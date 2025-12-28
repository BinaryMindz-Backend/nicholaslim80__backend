import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TransactionIdService } from 'src/common/services/transaction-id.service';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { CompetitionWorker } from 'src/core/workers/competition.worker';
import { ServiceZoneService } from 'src/modules/superadmin_root/service-zone/service-zone.service';
import { GeoService } from 'src/utils/geo-location.utils';
import { NotificationModule } from 'src/modules/superadmin_root/notification/notification.module';
import { SmsService } from 'src/common/services/sms.service';
import { QueueModule } from 'src/modules/queue/queue.module';
import { WalletModule } from 'src/common/wallet/wallet.module';
import { WalletService } from 'src/common/wallet/wallet.service';

@Module({
  imports:[RedisModule,NotificationModule, QueueModule, WalletModule],
  controllers: [OrderController],
  providers: [OrderService, TransactionIdService, CompetitionWorker,SmsService, ServiceZoneService,GeoService, WalletService],
})
export class OrderModule {}
