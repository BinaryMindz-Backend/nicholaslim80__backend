import { Controller, Get, Post, Param } from '@nestjs/common';
import { EmailQueueService } from '../services/email-queue.service';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';




// 
@Controller('admin/queue-monitor')
export class QueueMonitorController {
  constructor(private readonly emailQueueService: EmailQueueService) {}

  @Get('failed')
  @Auth()
  @ApiBearerAuth()
  async getFailedJobs() {
    return await this.emailQueueService.getFailedJobs(100);
  }

  @Get('job/:id')
  @Auth()
  @ApiBearerAuth()
  async getJobStatus(@Param('id') id: string) {
    return await this.emailQueueService.getJobStatus(id);
  }

  @Post('retry/:id')
  @Auth()
  @ApiBearerAuth()
  async retryJob(@Param('id') id: string) {
    return await this.emailQueueService.retryFailedJob(id);
  }
}