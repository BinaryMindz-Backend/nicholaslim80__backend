import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OtpService } from './otp.service';
import { JwtStrategy } from 'src/strategy/jwt.strategy';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from '../users_root/users/users.module';
import { UsersService } from '../users_root/users/users.service';
import { LoginRewardService } from './loginRewards.services';
import { NotificationModule } from '../superadmin_root/notification/notification.module';
import { CommonModule } from 'src/common/ common.module';
import { QueueModule } from '../queue/queue.module';


@Module({
  imports: [
    UsersModule,
    PassportModule,
    RedisModule,
    NotificationModule,
    CommonModule,
    QueueModule
  ],
  providers: [AuthService, OtpService, JwtStrategy, UsersService, LoginRewardService],
  controllers: [AuthController],
  exports: [AuthService, OtpService, LoginRewardService ],
})
export class AuthModule { }
