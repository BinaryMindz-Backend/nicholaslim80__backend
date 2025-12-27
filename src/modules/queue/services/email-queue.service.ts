import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailJobType, NotificationJobType } from '../interfaces/queue-job.interface';


// 
@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @InjectQueue('email-queue') private emailQueue: Queue,
    @InjectQueue('notification-queue') private notificationQueue: Queue,
  ) {}

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
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 24 * 3600,
            count: 1000,
          },
          removeOnFail: {
            age: 7 * 24 * 3600,
          },
        },
      );

      this.logger.log(`Welcome email queued for user ${data.userId}, Job ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to queue welcome email:', error);
      throw error;
    }
  }

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
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: {
            age: 24 * 3600,
            count: 500,
          },
          removeOnFail: {
            age: 7 * 24 * 3600,
          },
        },
      );

      this.logger.log(`Push notification queued for user ${data.userId}, Job ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to queue push notification:', error);
      throw error;
    }
  }

  async getJobStatus(jobId: string) {
    const emailJob = await this.emailQueue.getJob(jobId);
    if (emailJob) {
      return {
        id: emailJob.id,
        name: emailJob.name,
        progress: emailJob.progress, // Fixed: progress is a property, not a method
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