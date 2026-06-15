import { forwardRef, Module } from '@nestjs/common';
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
import { OrderGateway } from './order.gateway';
import { RaiderModule } from 'src/modules/raider_root/raider gateways/raider.module';
import { UserGateway } from '../users/user.gateways';
import { ActivityLogService } from 'src/modules/superadmin_root/additional_services/activity_logs.services';
import { SurgePricingRuleModule } from 'src/modules/superadmin_root/surge_pricing_rule/surge_pricing_rule.module';
import { SurgePricingRuleService } from 'src/modules/superadmin_root/surge_pricing_rule/surge_pricing_rule.service';
import { OrderCronService } from './order.corn.service';
import { ReceiptPdfService } from './order_reciept/order_reciept.services';


@Module({
  imports: [
    RedisModule,
    NotificationModule,
    QueueModule,
    WalletModule,
    SurgePricingRuleModule,
    forwardRef(() => RaiderModule)
  ],
  controllers: [OrderController],
  providers: [OrderService, SurgePricingRuleService, TransactionIdService, CompetitionWorker, SmsService, ServiceZoneService, GeoService, WalletService, OrderGateway, UserGateway, ActivityLogService,
    OrderCronService,
    ReceiptPdfService
  ],
  exports: [
    OrderService,
    OrderGateway,
    UserGateway,
    ActivityLogService,
    SurgePricingRuleService
  ]
})
export class OrderModule { }
