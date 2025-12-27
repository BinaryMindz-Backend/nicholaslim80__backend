/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from 'src/modules/superadmin_root/notification/notification.service';
import { NotificationJobType } from '../interfaces/queue-job.interface';


// 
@Processor('notification-queue', {
  concurrency: 10,
  limiter: {
    max: 20,
    duration: 1000,
  },
})
@Injectable()
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notifyService: NotificationService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing notification job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case NotificationJobType.PUSH_NOTIFICATION:
        return await this.handlePushNotification(job);
      // case NotificationJobType.SMS_NOTIFICATION:
      //   return await this.handleSmsNotification(job);
      default:
        throw new Error(`Unknown notification type: ${job.name}`);
    }
  }

  private async handlePushNotification(job: Job) {
    const { userId, fcmToken, title, body } = job.data;

    try {
      await this.notifyService.sendNotificationByType(
        'PUSH_NOTIFICATION',
        [{ fcmToken }],
        title,
        body,
      );

      this.logger.log(`✅ Push notification sent to user ${userId}`);
      return { success: true, userId };
    } catch (error) {
      this.logger.error(`❌ Push notification failed for user ${userId}:`, error.message);
      throw error;
    }
  }

  // private async handleSmsNotification(job: Job) {
  //   const { userId, phone, message } = job.data;

  //   try {
      // Implement SMS sending logic
      // await this.notifyService.sendSms(phone, message);

  //     this.logger.log(`✅ SMS sent to user ${userId}`);
  //     return { success: true, userId };
  //   } catch (error) {
  //     this.logger.error(`❌ SMS failed for user ${userId}:`, error.message);
  //     throw error;
  //   }
  // }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`✅ Notification job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ Notification job ${job.id} failed:`, error.message);
     const maxAttempts = job.opts?.attempts ?? 1;
    if (job.attemptsMade >= maxAttempts) {
      this.logger.error(`🚨 Notification delivery failed permanently for job ${job.id}`);
    }
  }
}