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

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
