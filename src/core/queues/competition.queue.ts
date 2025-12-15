import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const connection = new IORedis(process.env.REDIS_URL as string);

export const competitionQueue = new Queue('order-competition', {
  connection,
});
