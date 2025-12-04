/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'error'>
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [{ emit: 'event', level: 'error' }],
    });

    this.$on('error', (e: Prisma.LogEvent) => {
      this.logger.error('Error IN PRISMA', e.message);
    });
  }

  async onModuleInit() {

    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }


  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;

    const models = Reflect.ownKeys(this).filter((key) => key[0] !== '_');
    return Promise.all(
      models.map((modelKey) => {
        if (modelKey === '$transaction' || modelKey === '$queryRaw') return;
        return (this as any)[modelKey]?.deleteMany?.();
      }),
    );
  }

}