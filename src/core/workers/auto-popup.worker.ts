import { Worker } from 'bullmq';
import { connection } from '../queues/queue'
import { AutoPopupService } from 'src/modules/raider_root/auto_popup_services/auto-popup.service';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class AutoPopupWorker implements OnModuleInit, OnModuleDestroy {
  private worker!: Worker;

  constructor(private readonly autoPopupService: AutoPopupService) {}

  onModuleInit() {
    this.worker = new Worker(
      'auto-popup',
      async (job) => {
        if (job.name === 'popup-timeout') {
          const { orderId, raiderId } = job.data;
          await this.autoPopupService.handlePopupTimeout(orderId, raiderId);
        }
      },
      { connection },
    );

    this.worker.on('completed', (job) => {
      console.log(`✅ Popup timeout job done: ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Popup timeout job failed: ${job?.id}`, err.message);
    });

    console.log('✅ AutoPopup worker started');
  }

  // Clean shutdown — prevents Redis connection leak on app restart
  async onModuleDestroy() {
    await this.worker?.close();
    console.log('🛑 AutoPopup worker stopped');
  }
}