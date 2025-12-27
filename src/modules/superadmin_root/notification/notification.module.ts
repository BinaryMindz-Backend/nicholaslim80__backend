import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { MailService } from 'src/common/services/mail.service';
import { SmsService } from 'src/common/services/sms.service';
import { PrismaService } from 'src/core/database/prisma.service';
import { NotificationSchedulerService } from './scheduler.service';
import { FirebaseService } from './firebase.service';
import { CommonModule } from 'src/common/ common.module';

@Module({
  imports:[
    CommonModule
  ],
  controllers: [NotificationController],
  providers: [
    // 
    NotificationService,
    FirebaseService,
    MailService,
    SmsService,
    PrismaService,
    NotificationSchedulerService
  ],
   exports: [FirebaseService, NotificationService],
})
export class NotificationModule {}
