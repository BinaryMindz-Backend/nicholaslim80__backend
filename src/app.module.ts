import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './core/database/database.module';
import { HealthModule } from './modules/app_health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import Joi from 'joi';
import { RedisModule } from './modules/auth/redis/redis.module';
import { UsersModule } from './modules/users_root/users/users.module';
import { DeliveryTypeModule } from './modules/superadmin_root/delivery-type/delivery-type.module';
import { VehicleTypeModule } from './modules/superadmin_root/vehicle-type/vehicle-type.module';
import { DestinationModule } from './modules/users_root/destination/destination.module';
import { OrderModule } from './modules/users_root/order/order.module';
import { PaymentOptionModule } from './modules/users_root/payment-option/payment-option.module';
import { ReferloyalityModule } from './modules/users_root/referloyality/referloyality.module';
import { IncentiveModule } from './modules/superadmin_root/incentive/incentive.module';
import { RidersProfileModule } from './modules/raider_root/riders_profile/riders_profile.module';
import { QuizModule } from './modules/superadmin_root/quiz/quiz.module';
import { QuestionsModule } from './modules/superadmin_root/questions/questions.module';
import { PlatformFeeModule } from './modules/superadmin_root/platform_fee/platform_fee.module';

import { MessageModule } from './modules/message/message.module';
import { JwtModule } from '@nestjs/jwt';
import { StripeModule } from './modules/stripe_root/stripe/stripe.module';
import { MyRaiderModule } from './modules/users_root/my_raider/my_raider.module';
import { NotificationModule } from './modules/superadmin_root/notification/notification.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PolicyManagementModule } from './modules/superadmin_root/policy_management/policy_management.module';
import { ContentManagementModule } from './modules/superadmin_root/content_management/content_management.module';
import { CoinManagementModule } from './modules/superadmin_root/coin_management/coin_management.module';
import { TransactionIdService } from './common/services/transaction-id.service';
import { AdvertiseModule } from './modules/superadmin_root/advertise/advertise.module';
import { FaqModule } from './modules/superadmin_root/faq/faq.module';
import { ArticleModule } from './modules/superadmin_root/article/article.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,       // Config available globally
      envFilePath: '.env',  // Path to your .env file
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
      }),
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'changeme',
      signOptions: { expiresIn: '7d' },
    }),
    UsersModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    DeliveryTypeModule,
    VehicleTypeModule,
    RedisModule,
    DestinationModule,
    OrderModule,
    PaymentOptionModule,
    ReferloyalityModule,
    IncentiveModule,
    RidersProfileModule,
    QuizModule,
    QuestionsModule,
    PlatformFeeModule,
    MessageModule,
    MyRaiderModule,
    StripeModule,
    NotificationModule,
    ScheduleModule.forRoot(),
    PolicyManagementModule,
    ContentManagementModule,
    CoinManagementModule,
    AdvertiseModule,
    FaqModule,
    ArticleModule,


  ],
  controllers: [AppController],
  providers: [
    AppService,
    TransactionIdService],
  exports: [
    TransactionIdService
  ]
})
export class AppModule { }
