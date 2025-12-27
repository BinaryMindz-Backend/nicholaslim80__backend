import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailQueueService } from './services/email-queue.service';
import { EmailProcessor } from './processors/email.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { QueueMonitorController } from './controllers/queue-monitor.controller';
import { NotificationModule } from '../superadmin_root/notification/notification.module';
import { CommonModule } from 'src/common/ common.module';


@Module({
  imports: [
    // Register queues
    BullModule.registerQueue({
      name: 'email-queue',
    }),
    BullModule.registerQueue({
      name: 'notification-queue',
    }),
    // Import modules that processors need
    CommonModule,
    NotificationModule,
  ],
  controllers: [QueueMonitorController],
  providers: [
    EmailQueueService,
    EmailProcessor,        // 📧 Email processor here
    NotificationProcessor, // 🔔 Notification processor here
  ],
  exports: [EmailQueueService], // Export for use in other modules
})
export class QueueModule {}