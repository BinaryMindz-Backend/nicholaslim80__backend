import { Module } from '@nestjs/common';
import { MailService } from './services/mail.service';
import { SmsService } from './services/sms.service';

@Module({
  providers: [MailService, SmsService],
  exports: [MailService, SmsService],
})
export class CommonModule {}
