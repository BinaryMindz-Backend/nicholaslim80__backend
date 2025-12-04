/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Inject, Injectable } from '@nestjs/common';
import type { RedisClientType } from 'redis';


@Injectable()
export class RedisService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly client: RedisClientType,
  ) {}

  /** Get raw Redis client */
  getClient() {
    return this.client;
  }

  /** Set a value */
  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds)
      return this.client.set(key, value, { EX: ttlSeconds });

    return this.client.set(key, value);
  }

  /** Get value */
  async get(key: string) {
    return this.client.get(key);
  }

  /** Delete key */
  async del(key: string) {
    return this.client.del(key);
  }
}
