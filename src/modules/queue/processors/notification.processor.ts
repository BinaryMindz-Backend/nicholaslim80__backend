/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from 'src/modules/superadmin_root/notification/notification.service';
import { NotificationJobType } from '../interfaces/queue-job.interface';
import { PrismaService } from 'src/core/database/prisma.service';
import { NotificationType } from '@prisma/client';

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

  constructor(private readonly notifyService: NotificationService,
    private readonly prisma: PrismaService,
  ) {
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

      case NotificationJobType.SMS_NOTIFICATION:
        return await this.handleSmsNotification(job);
      case NotificationJobType.WHATSAPP_NOTIFICATION:
        return await this.handleWhatsAppNotification(job)

      default:
        throw new Error(`Unknown notification type: ${job.name}`);
    }
  }



  // GENERAL NOTIFICATIONS  
  private async handlePushNotification(job: Job) {
    const { userId, fcmToken, type, title, body, data } = job.data;
    // 
    try {
      await this.notifyService.sendNotificationByType(
        'PUSH_NOTIFICATION',
        [{ fcmToken }],
        title,
        body,
      );
      // save to notification history
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type,
          title,
          orderId: Number(data.orderId),
          message: body,
          is_from_admin: false,
        },
      });
      //  console.log(notification , type, );
      this.logger.log(`✅ Push notification sent to user ${userId} and saved to history with ID ${notification.id}`);
      return { success: true, userId, notificationId: notification.id };
    } catch (error: any) {
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
      // save to notification history
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type: job.data.status,
          title: job.data.title,
          orderId,
          message: message,
          target_role: job.data.target_role,
          is_from_admin: false,
        },
      });
      this.logger.log(`✅ Order status notification sent to user ${userId} for order ${orderId} and saved to history with ID ${notification.id}`);
      return { success: true, userId, orderId, notificationId: notification.id };
    } catch (error: any) {
      this.logger.error(`❌ Order status notification failed for user ${userId}:`, error.message);
      throw error;
    }
  }




  // RIDER ASSIGNMENT NOTIFICATIONS  
  private async handleOrderAssignedNotification(job: Job) {
    const { userId, fcmToken, orderId, raiderName } = job.data;

    const title = '📝 Your Order Has a Rider!';
    const message = `Your order #${orderId} has been assigned to ${raiderName}.`;

    try {
      await this.notifyService.sendNotificationByType(
        'PUSH_NOTIFICATION',
        [{ fcmToken }],
        title,
        message,
      );

      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type: 'ORDER_UPDATE',
          title,
          message,
          is_from_admin: false,
        },
      });

      this.logger.log(`✅ Order assigned notification sent to user ${userId} and saved to history with ID ${notification.id}`);
      return { success: true, userId, orderId, notificationId: notification.id };
    } catch (error: any) {
      this.logger.error(`❌ Order assigned notification failed for user ${userId}:`, error.message);
      throw error;
    }
  }

  private async handleOrderAssignedNotificationRaider(job: Job) {
    const { userId, fcmToken, orderId, raiderName } = job.data;

    const title = '📝 New Order Assigned!';
    const message = `Hello ${raiderName ?? 'Rider'}, order #${orderId} has been assigned to you. Please start the delivery.`;

    try {
      await job.updateProgress(10);

      await this.notifyService.sendNotificationByType(
        'PUSH_NOTIFICATION',
        [{ fcmToken }], // wrapped in array for consistency
        title,
        message,
      );

      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type: 'ORDER_UPDATE',
          title,
          orderId,
          message,
          is_from_admin: false,
        },
      });

      await job.updateProgress(100);
      this.logger.log(`✅ Push notification sent to raider with token ${fcmToken} for order ${orderId} and saved to history with ID ${notification.id}`);

      return { success: true, fcmToken, orderId, notificationId: notification.id, timestamp: new Date() };
    } catch (error: any) {
      this.logger.error(`❌ Failed to send push notification for order ${orderId}:`, error.message);
      throw error;
    }
  }

  private async handleOrderLostNotification(job: Job) {
    const { raiderId, fcmToken, orderId } = job.data;

    const title = 'Order Taken';
    const message = 'Another rider won this order. Keep trying!';

    try {
      await this.notifyService.sendNotificationByType(
        'PUSH_NOTIFICATION',
        [{ fcmToken }],
        title,
        message,
      );

      const notification = await this.prisma.notification.create({
        data: {
          userId: raiderId, // raiderId is the userId here
          type: 'ORDER_UPDATE',
          title,
          orderId,
          message,
          is_from_admin: false,
        },
      });

      this.logger.log(`✅ Order lost notification sent to raider ${raiderId}`);
      this.logger.log(`✅ Push notification sent to raider with token ${fcmToken} for order ${orderId} and saved to history with ID ${notification.id}`);
      return { success: true, raiderId };
    } catch (error: any) {
      this.logger.error(`❌ Order lost notification failed for raider ${raiderId}:`, error.message);
      throw error;
    }
  }





  // SMS NOTIFICATIONS 
  private async handleSmsNotification(job: Job) {
    const { to, message, orderId, ruleId } = job.data;

    try {
      const res = await this.notifyService.sendNotificationByType(NotificationType.SMS, [{ phone: to }], job.data.title, message);

      this.logger.log(`✅ SMS sent to ${to}${orderId ? ` for order ${orderId}` : ''}`);
      return { success: true, to };
    } catch (error: any) {
      this.logger.error(`❌ SMS failed for ${to}:`, error.message);
      throw error;
    }
  }

  //WHATSAPP NOTIFICATIONS
  private async handleWhatsAppNotification(job: Job) {
    const { to, message, orderId, ruleId } = job.data;

    try {
      // TODO: replace with real WhatsApp Business API call once built
      this.logger.warn(`[STUB] WhatsApp not yet integrated. Would send to ${to}: "${message}"`);
      return { success: true, to, stubbed: true };

      // Once you have a real WhatsappService, swap the above for:
      // const res = await this.whatsappService.send({ to, message });
      // this.logger.log(`✅ WhatsApp sent to ${to}${orderId ? ` for order ${orderId}` : ''}`);
      // return { success: true, to, messageId: res.sid };
    } catch (error: any) {
      this.logger.error(`❌ WhatsApp failed for ${to}:`, error.message);
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