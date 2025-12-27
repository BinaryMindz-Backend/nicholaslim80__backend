/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from 'src/modules/superadmin_root/notification/notification.service';
import { NotificationJobType } from '../interfaces/queue-job.interface';

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
      case 'order-status-notification':
        return await this.handleOrderStatusNotification(job);
      case 'order-assigned-notification':
        return await this.handleOrderAssignedNotification(job);
      case 'order-assigned-raider-notification':
        return await this.handleOrderAssignedNotificationRaider(job);
      case 'order-lost-notification':
        return await this.handleOrderLostNotification(job);
      default:
        throw new Error(`Unknown notification type: ${job.name}`);
    }
  }

  // GENERAL NOTIFICATIONS  
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

  // ORDER STATUS NOTIFICATIONS  
  private async handleOrderStatusNotification(job: Job) {
    const { userId, fcmToken, orderId, orderNumber, status, message } = job.data;

    try {
      await this.notifyService.sendNotificationByType(
        'PUSH_NOTIFICATION',
        [{ fcmToken }],
        `Order ${orderNumber ?? orderId} - ${status}`,
        message,
      );

      this.logger.log(`✅ Order status notification sent to user ${userId} for order ${orderId}`);
      return { success: true, userId, orderId };
    } catch (error) {
      this.logger.error(`❌ Order status notification failed for user ${userId}:`, error.message);
      throw error;
    }
  }

  // RIDER ASSIGNMENT NOTIFICATIONS  
  private async handleOrderAssignedNotification(job: Job) {
    const { userId, fcmToken, orderId, raiderName } = job.data;

    try {
      await this.notifyService.sendNotificationByType(
        'PUSH_NOTIFICATION',
        [{ fcmToken }],
        '📝 Your Order Has a Rider!',
        `Your order #${orderId} has been assigned to ${raiderName}.`,
      );

      this.logger.log(`✅ Order assigned notification sent to user ${userId}`);
      return { success: true, userId, orderId };
    } catch (error) {
      this.logger.error(`❌ Order assigned notification failed for user ${userId}:`, error.message);
      throw error;
    }
  }

    // 
    private async handleOrderAssignedNotificationRaider(job: Job) {
    const { fcmToken, orderId, raiderName } = job.data;

    try {
      await job.updateProgress(10);

      // Replace this with your actual FCM sending logic
      await this.notifyService.sendNotificationByType(
        'PUSH_NOTIFICATION',
         fcmToken,
       '📝 New Order Assigned!',
       `Hello ${raiderName ?? 'Rider'}, order #${orderId} has been assigned to you. Please start the delivery.`,
      );

      await job.updateProgress(100);
      this.logger.log(`✅ Push notification sent to raider with token ${fcmToken} for order ${orderId}`);

      return { success: true, fcmToken, orderId, timestamp: new Date() };
    } catch (error) {
      this.logger.error(`❌ Failed to send push notification for order ${orderId}:`, error.message);
      throw error;
    }
  }

    private async handleOrderLostNotification(job: Job) {
      const { raiderId, fcmToken } = job.data;

      try {
        await this.notifyService.sendNotificationByType(
          'PUSH_NOTIFICATION',
          [{ fcmToken }],
          'Order Taken',
          'Another rider won this order. Keep trying!',
        );

        this.logger.log(`✅ Order lost notification sent to raider ${raiderId}`);
        return { success: true, raiderId };
      } catch (error) {
        this.logger.error(`❌ Order lost notification failed for raider ${raiderId}:`, error.message);
        throw error;
      }
    }

  // EVENT HANDLERS  
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
      // TODO: Send alert to ops team
    }
  }
}