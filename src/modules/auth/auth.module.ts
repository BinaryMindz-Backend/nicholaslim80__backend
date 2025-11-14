import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';

import { AuthController } from './auth.controller';

import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { OtpService } from './otp.service';
import { UsersService } from '../users/users.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
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
