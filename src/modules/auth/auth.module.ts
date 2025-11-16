import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OtpService } from './otp.service';
import { JwtStrategy } from 'src/strategy/jwt.strategy';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from '../users_ROOT/users/users.module';
import { UsersService } from '../users_ROOT/users/users.service';


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
