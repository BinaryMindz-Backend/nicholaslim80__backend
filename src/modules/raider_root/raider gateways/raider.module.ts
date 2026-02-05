import {  forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RaiderGateway } from './raider.gateway';
import { RaiderService } from './raider.service';
import { OrderModule } from 'src/modules/users_root/order/order.module';
import { PrismaService } from 'src/core/database/prisma.service';
import { RedisService } from 'src/modules/auth/redis/redis.service';
import { TipModule } from 'src/modules/users_root/tip/tip.module';
import { WalletModule } from 'src/common/wallet/wallet.module';

@Module({
  imports: [
    forwardRef(()=> OrderModule),
    forwardRef(() => TipModule),
    forwardRef(() => WalletModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  providers: [
    RaiderGateway, 
    RaiderService,
    PrismaService,
    RedisService
  ],
  exports:[
     RaiderGateway,
     RaiderService
  ]
})
export class RaiderModule {}