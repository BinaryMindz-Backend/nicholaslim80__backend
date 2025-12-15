import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const connection = new IORedis({
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT) || 6379,
});

export const competitionQueue = new Queue('order-competition', {
  connection,
});
