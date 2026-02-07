import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { EmailJobType, NotificationJobType } from '../interfaces/queue-job.interface';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @InjectQueue('email-queue') private emailQueue: Queue,
    @InjectQueue('notification-queue') private notificationQueue: Queue,
  ) {}

  // USER REGISTRATION & AUTHENTICATION  
  async queueWelcomeEmail(data: {
    userId: number;
    email: string;
    username?: string;
    referralCode?: string;
  }) {
    try {
      const job = await this.emailQueue.add(
        EmailJobType.WELCOME_EMAIL,
        data,
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 24 * 3600, count: 1000 },
          removeOnFail: { age: 7 * 24 * 3600 },
        },
      );

      this.logger.log(`Welcome email queued for user ${data.userId}, Job ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to queue welcome email:', error);
      throw error;
    }
  }
  // 
  async queueOtpEmail(data: {
    email: string;
    otp: string;
  }) {
    try {
      const job = await this.emailQueue.add(
        EmailJobType.OTP_EMAIL,
        data,
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 24 * 3600, count: 1000 },
          removeOnFail: { age: 7 * 24 * 3600 },
        },
      );

      this.logger.log(
        `OTP email queued for user ${data.email}, Job ID: ${job.id}`,
      );

      return job;
    } catch (error) {
      this.logger.error('Failed to queue OTP email', error);
      throw error;
    }
  }

  // PUSH NOTIFICATIONS
  async queuePushNotification(data: {
    userId: number;
    fcmToken: string;
    title: string;
    body: string;
  }) {
    try {
      const job = await this.notificationQueue.add(
        NotificationJobType.PUSH_NOTIFICATION,
        data,
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { age: 24 * 3600, count: 500 },
          removeOnFail: { age: 7 * 24 * 3600 },
        },
      );

      this.logger.log(`Push notification queued for user ${data.userId}, Job ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to queue push notification:', error);
      throw error;
    }
  }

  // ORDER MANAGEMENT - PENDING ORDERS  
  async queueOrderPendingEmail(data: {
    userId: number;
    email: string;
    username?: string;
    status?:string,
    orderId: number;
    orderNumber?: string;
    amount?: number;
    statusMessage:string;
    
  }){
    try {
      const job = await this.emailQueue.add(
        'order-pending-email',
        data,
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 24 * 3600, count: 1000 },
          removeOnFail: { age: 7 * 24 * 3600 },
        },
      );

      this.logger.log(`Order pending email queued for order ${data.orderId}, Job ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to queue order pending email:', error);
    }
  }

  async queueBulkOrderPendingEmail(data: {
      userId: number;
      email: string;
      username?: string;
      orderIds: number[];
      totalOrders: number;
      totalAmount?: number;
    }): Promise<Job> {
      try {
        const job = await this.emailQueue.add(
          'bulk-order-pending-email',
          data,
          {
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: { age: 24 * 3600, count: 1000 },
            removeOnFail: { age: 7 * 24 * 3600 },
          },
        );

        this.logger.log(
          `Bulk order pending email queued for ${data.totalOrders} orders, Job ID: ${job.id}`,
        );

        return job;
      } catch (error) {
        this.logger.error('Failed to queue bulk order pending email', error);
        throw error; // ✅ IMPORTANT
      }
    }

  async queueOrderStatusNotification(data: {
    userId: number;
    fcmToken: string;
    orderId?: number | string;
    orderNumber?: string;
    status: string;
    title: string;
    message: string;
  }) {
    try {
      const job = await this.notificationQueue.add(
        'order-status-notification',
        data,
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { age: 24 * 3600, count: 500 },
          removeOnFail: { age: 7 * 24 * 3600 },
        },
      );

      this.logger.log(`Order status notification queued for order ${data.orderId}, Job ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to queue order status notification:', error);
    }
  }

  // ORDER ASSIGNMENT - RIDER NOTIFICATIONS
   async queueOrderAssignedUserEmail(data: {
    userId: number;
    email: string;
    username?: string;
    orderId: number;
    raiderName: string;
    raiderRank?: string;
  }) {
    try {
      const job = await this.emailQueue.add(
        'order-assigned-user-email',
        data,
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 24 * 3600, count: 1000 },
          removeOnFail: { age: 7 * 24 * 3600 },
        },
      );

      this.logger.log(`Order assigned email queued for user ${data.userId}, Job ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to queue order assigned email:', error);
    }
  }
  async queueOrderAssignedDriverEmail(data: {
      driverId: number;
      name:string,
      email: string;
      orderId: number;
      raiderRank?: string;
    }) {
      try {
        const job = await this.emailQueue.add(
          'order-assigned-driver-email', // job name
          data,
          {
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: { age: 24 * 3600, count: 1000 },
            removeOnFail: { age: 7 * 24 * 3600 },
          },
        );

        this.logger.log(`Order assigned email queued for driver ${data.driverId}, Job ID: ${job.id}`);
        return job;
      } catch (error) {
        this.logger.error('Failed to queue order assigned email for driver:', error);
      }
    }

  // ORDER ASSIGNMENT - DRIVER NOTIFICATIONS
  async queueOrderAssignedNotificationRaider(data: {
    userId: number;
    fcmToken: string;
    orderId: number;
    raiderName?: string;
  }) {
    try {
      const job = await this.emailQueue.add(
        'order-assigned-raider-notification', // Job name
        data,
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 24 * 3600, count: 1000 },
          removeOnFail: { age: 7 * 24 * 3600 },
        }
      );

      this.logger.log(`📱 Push notification queued for raider ${data.userId}, Job ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to queue push notification for raider:', error);
    }
  }

  async queueOrderAssignedNotification(data: {
    userId: number;
    fcmToken: string;
    orderId: number;
    raiderName: string;
  }) {
    try {
      const job = await this.notificationQueue.add(
        'order-assigned-notification',
        data,
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { age: 24 * 3600, count: 500 },
          removeOnFail: { age: 7 * 24 * 3600 },
        },
      );

      this.logger.log(`Order assigned notification queued for user ${data.userId}, Job ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to queue order assigned notification:', error);
    }
  }

  async queueOrderLostNotification(data: {
    raiderId: number;
    fcmToken: string;
    orderId: number;
  }) {
    try {
      const job = await this.notificationQueue.add(
        'order-lost-notification',
        data,
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { age: 24 * 3600, count: 500 },
          removeOnFail: { age: 7 * 24 * 3600 },
        },
      );

      this.logger.log(`Order lost notification queued for raider ${data.raiderId}, Job ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to queue order lost notification:', error);
    }
  }

  async queueBatchOrderLostNotifications(notifications: Array<{
    raiderId: number;
    fcmToken: string;
    orderId: number;
  }>) {
    try {
      const jobs = await Promise.allSettled(
        notifications.map(data => this.queueOrderLostNotification(data))
      );

      const successful = jobs.filter(job => job.status === 'fulfilled').length;
      this.logger.log(`Queued ${successful}/${notifications.length} order lost notifications`);
      
      return { successful, total: notifications.length };
    } catch (error) {
      this.logger.error('Failed to queue batch order lost notifications:', error);
    }
  }



  // MONITORING & MANAGEMENT  
  async getJobStatus(jobId: string) {
    const emailJob = await this.emailQueue.getJob(jobId);
    if (emailJob) {
      return {
        id: emailJob.id,
        name: emailJob.name,
        progress: emailJob.progress,
        state: await emailJob.getState(),
        attemptsMade: emailJob.attemptsMade,
        failedReason: emailJob.failedReason,
        data: emailJob.data,
        returnvalue: emailJob.returnvalue,
        processedOn: emailJob.processedOn,
        finishedOn: emailJob.finishedOn,
      };
    }
    return null;
  }

  async getFailedJobs(limit = 50) {
    const failed = await this.emailQueue.getFailed(0, limit);
    return failed.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
    }));
  }

  async retryFailedJob(jobId: string) {
    const job = await this.emailQueue.getJob(jobId);
    if (job) {
      await job.retry();
      return { success: true, message: 'Job retry initiated' };
    }
    return { success: false, message: 'Job not found' };
  }
}
