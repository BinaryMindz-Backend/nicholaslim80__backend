/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { MailService } from 'src/common/services/mail.service';
import { EmailJobType } from '../interfaces/queue-job.interface';


// 
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
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }

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
      // TODO: Send alert to ops team
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`⚙️ Job ${job.id} is now active`);
  }
}