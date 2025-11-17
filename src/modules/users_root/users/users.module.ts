import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RedisModule } from 'src/modules/auth/redis/redis.module';
import { OtpService } from 'src/modules/auth/otp.service';


@Module({
  imports:[
      RedisModule
  ],
  controllers: [UsersController],
  providers: [UsersService, OtpService],
})
export class UsersModule {}
