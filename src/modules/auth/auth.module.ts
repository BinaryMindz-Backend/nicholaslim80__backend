import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { OtpService } from './otp.service';
import { UsersService } from '../users/users.service';
import { JwtStrategy } from 'src/strategy/jwt.strategy';
import { RedisModule } from './redis/redis.module';


@Module({
  imports: [
    UsersModule,
    PassportModule,
    RedisModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AuthService, OtpService, JwtStrategy, UsersService],
  controllers: [AuthController],
  exports: [AuthService, OtpService],
})
export class AuthModule {}
