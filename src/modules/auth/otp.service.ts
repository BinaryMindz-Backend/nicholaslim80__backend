/* eslint-disable @typescript-eslint/require-await */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  NotAcceptableException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/core/database/prisma.service';
import { RedisService } from './redis/redis.service';

@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  private async hashOtp(otp: string) {
    return bcrypt.hash(otp, Number(process.env.SALT_ROUNDS ?? 10));
  }

  private buildKey(userId: number) {
    return `OTP:${userId}`;
  }


  
  /** ------------ Generate & Save OTP (Signup/Login) -------------- **/
  async generateOtp(email?: string | null, phone?: string) {
    // 
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (!user) throw new NotFoundException('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = await this.hashOtp(otp);

    const ttl = Number(process.env.OTP_TTL_MINUTES ?? 5) * 60;
    const key = this.buildKey(user.id);

    // Store hashed OTP in Redis
    await this.redisService.set(key, hashed, ttl);

    await this.sendOtpNotification(user.email, otp, user.phone);

    return { otp, ttl }; // remove in production
  }
  
  // 
  async sendOtpNotification(email: string | null, otp: string, phone?: string | null) {
    console.log(`📩 OTP sent >>> email=${email} phone=${phone} otp=${otp}`);
  }



  /** ------------ Verify OTP (Signup Verification) -------------- **/
  async verifyOtp(email: string | undefined, phone: string | undefined, otp: string) {
    // 
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (!user) throw new NotFoundException('User not found');

    const key = this.buildKey(user.id);
    const hashedOtp = await this.redisService.get(key);

    if (!hashedOtp) {
      throw new BadRequestException('OTP expired or not requested');
    }

    const valid = await bcrypt.compare(otp, hashedOtp);
    if (!valid) throw new BadRequestException('Invalid OTP');

    // Mark user verified
    await this.prisma.user.update({
      where: { id: user.id },
      data: { is_verified: true },
    });

    await this.redisService.del(key);
    return true;
  }



  /** ------------ Verify OTP (Login) -------------- **/
  async verifyOtpForLoginAndClear(email: string | undefined, phone: string | undefined, otp: string) { 
    // 
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (!user) throw new BadRequestException('User not found');

    if (!user.is_verified) {
      throw new NotAcceptableException('Signup and verify first.');
    }
    
    const key = this.buildKey(user.id);
    const hashedOtp = await this.redisService.get(key);

    if (!hashedOtp) throw new BadRequestException('OTP expired or missing');

    const valid = await bcrypt.compare(otp, hashedOtp);
    if (!valid) throw new BadRequestException('Invalid OTP');

    // Clear OTP after login
    await this.redisService.del(key);

    return true;
  }
}
