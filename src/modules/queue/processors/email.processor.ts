/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { MailService } from 'src/common/services/mail.service';
import { EmailJobType } from '../interfaces/queue-job.interface';

@Processor('email-queue', {
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000,
  },
})
@Injectable()
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
    this.logger.log(`Attempt ${job.attemptsMade + 1} of ${job.opts?.attempts ?? 1}`);

    switch (job.name) {
      case EmailJobType.WELCOME_EMAIL:
        return await this.handleWelcomeEmail(job);
      case EmailJobType.OTP_EMAIL:
        return await this.handleOtpEmail(job);
      case EmailJobType.PASSWORD_RESET:
        return await this.handlePasswordReset(job);
      case EmailJobType.REFERRAL_BONUS:
        return await this.handleReferralBonus(job);
      case 'order-pending-email':
        return await this.handleOrderPendingEmail(job);
      case 'bulk-order-pending-email':
        return await this.handleBulkOrderPendingEmail(job);
      case 'order-assigned-user-email':
        return await this.handleOrderAssignedUserEmail(job);
      case 'order-assigned-driver-email':
        return await this.handleOrderAssignedDriverEmail(job);
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }

  // USER REGISTRATION EMAILS  
  private async handleWelcomeEmail(job: Job) {
    const { email, username, referralCode } = job.data;

    try {
      await job.updateProgress(10);

      await this.mailService.sendTemplateMail(
        'after-first-signup',
        email,
        'Welcome to NodeNINJAr!',
        {
          name: username ?? 'User',
          referralCode: referralCode,
        },
      );

      await job.updateProgress(100);
      this.logger.log(`✅ Welcome email sent successfully to ${email}`);
      
      return { success: true, email, timestamp: new Date() };
    } catch (error) {
      this.logger.error(`❌ Welcome email failed for ${email}:`, error.message);
      throw error;
    }
  }

  private async handleOtpEmail(job: Job) {
    const { email, otp } = job.data;
    await this.mailService.sendTemplateMail('otp', email, 'Your OTP', { otp });
    return { success: true };
  }

  private async handlePasswordReset(job: Job) {
    const { email, resetLink } = job.data;
    await this.mailService.sendTemplateMail('password-reset', email, 'Reset Your Password', { resetLink });
    return { success: true };
  }

  private async handleReferralBonus(job: Job) {
    const { email, username, bonusAmount } = job.data;
    await this.mailService.sendTemplateMail('referral-bonus', email, 'You earned a bonus!', { 
      username, 
      bonusAmount 
    });
    return { success: true };
  }

  // ORDER MANAGEMENT EMAILS  
  private async handleOrderPendingEmail(job: Job) {
    const { email, username, orderId, orderNumber, amount, items } = job.data;

    try {
      await job.updateProgress(10);

      await this.mailService.sendTemplateMail(
        'order-pending',
        email,
        'Your Order is Being Processed',
        {
          name: username ?? 'Customer',
          orderId,
          orderNumber: orderNumber ?? `ORD-${orderId}`,
          amount,
          items,
          statusMessage: 'Your order has been received and is being processed.',
        },
      );

      await job.updateProgress(100);
      this.logger.log(`✅ Order pending email sent to ${email} for order ${orderId}`);
      
      return { success: true, email, orderId, timestamp: new Date() };
    } catch (error) {
      this.logger.error(`❌ Order pending email failed for order ${orderId}:`, error.message);
      throw error;
    }
  }

  private async handleBulkOrderPendingEmail(job: Job) {
    const { email, username, orderIds, totalOrders, totalAmount } = job.data;

    try {
      await job.updateProgress(10);

      await this.mailService.sendTemplateMail(
        'bulk-order-pending',
        email,
        `${totalOrders} Orders Are Being Processed`,
        {
          name: username ?? 'Customer',
          totalOrders,
          orderIds,
          totalAmount,
          statusMessage: `We've received your ${totalOrders} orders and they are being processed.`,
        },
      );

      await job.updateProgress(100);
      this.logger.log(`✅ Bulk order email sent to ${email} for ${totalOrders} orders`);
      
      return { success: true, email, totalOrders, timestamp: new Date() };
    } catch (error) {
      this.logger.error(`❌ Bulk order email failed:`, error.message);
      throw error;
    }
  }

  private async handleOrderAssignedUserEmail(job: Job) {
    const { email, username, orderId, raiderName, raiderRank } = job.data;

    try {
      await job.updateProgress(10);

      await this.mailService.sendTemplateMail(
        'order-assigned-user',
        email,
        '📝 Your Order Has a Rider!',
        {
          name: username ?? 'User',
          orderId,
          raiderName: raiderName ?? 'Rider',
          raiderRank,
        },
      );

      await job.updateProgress(100);
      this.logger.log(`✅ Order assigned email sent to ${email} for order ${orderId}`);
      
      return { success: true, email, orderId, timestamp: new Date() };
    } catch (error) {
      this.logger.error(`❌ Order assigned email failed for order ${orderId}:`, error.message);
      throw error;
    }
  }
  // 
  private async handleOrderAssignedDriverEmail(job: Job) {
    const { email, name, orderId, raiderRank } = job.data; // driver info

    try {
      await job.updateProgress(10);

      await this.mailService.sendTemplateMail(
        'order-competition', // file: order-assigned-driver.hbs
         email,
        '🎉 You Have a New Assigned Order!',
        {
          name: name ?? 'Rider',
          orderId,
          rank: raiderRank ?? 'N/A',
        }
      );

      await job.updateProgress(100);
      this.logger.log(`✅ Order assigned email sent to driver ${email} for order #${orderId}`);
      
      return { success: true, email, orderId, timestamp: new Date() };
    } catch (error) {
      this.logger.error(`❌ Order assigned email failed for driver ${email} (order #${orderId}):`, error.message);
      throw error;
    }
  }

  // EVENT HANDLERS  
  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`✅ Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ Job ${job.id} failed after ${job.attemptsMade} attempts:`, error.message);
    
    const maxAttempts = job.opts?.attempts ?? 1;
    if (job.attemptsMade >= maxAttempts) {
      this.logger.error(`🚨 ALERT: Job ${job.id} exhausted all retries. Manual intervention needed.`);
      // TODO: Send alert to ops team (Slack, PagerDuty, etc.)
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`⚙️ Job ${job.id} is now active`);
  }
}