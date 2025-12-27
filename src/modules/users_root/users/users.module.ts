import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RedisModule } from 'src/modules/auth/redis/redis.module';
import { OtpService } from 'src/modules/auth/otp.service';
import { NotificationService } from 'src/modules/superadmin_root/notification/notification.service';
import { NotificationModule } from 'src/modules/superadmin_root/notification/notification.module';
import { MailService } from 'src/common/services/mail.service';
import { CommonModule } from 'src/common/ common.module';
import { QueueModule } from 'src/modules/queue/queue.module';


@Module({
  imports:[
      RedisModule,
      NotificationModule,
      CommonModule,
      QueueModule
  ],
  controllers: [UsersController],
  providers: [UsersService, OtpService, NotificationService, MailService],

})
export class UsersModule {}
