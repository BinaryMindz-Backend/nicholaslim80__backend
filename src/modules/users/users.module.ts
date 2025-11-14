import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { OtpService } from '../auth/otp.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, OtpService],
})
export class UsersModule {}
