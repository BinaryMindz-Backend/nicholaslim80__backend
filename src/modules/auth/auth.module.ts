import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OtpService } from './otp.service';
import { JwtStrategy } from 'src/strategy/jwt.strategy';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from '../users_root/users/users.module';
import { UsersService } from '../users_root/users/users.service';


@Module({
  imports: [
    UsersModule,
    PassportModule,
    RedisModule,
  ],
  providers: [AuthService, OtpService, JwtStrategy, UsersService],
  controllers: [AuthController],
  exports: [AuthService, OtpService],
})
export class AuthModule { }
