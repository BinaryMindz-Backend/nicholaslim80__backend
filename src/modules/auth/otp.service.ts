/* eslint-disable @typescript-eslint/require-await */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  constructor(private prisma: PrismaService) {}

  private async hashOtp(otp: string) {
    const salt = Number(process.env.SALT_ROUNDS ?? 10);
    return bcrypt.hash(otp, salt);
  }

  // generate numeric OTP and store hashed version + expiry
  async generateOtpForEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const hashed = await this.hashOtp(otp);
    const ttlMinutes = Number(process.env.OTP_TTL_MINUTES ?? 5);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.prisma.user.update({
      where: { email },
      data: { otp_code: hashed, otp_expires_at: expiresAt },
    });

    // TODO: Replace with real notifier (SMS/Email)
    await this.sendOtpNotification(user.email, otp, user.phone);

    return { otp, expiresAt }; //**TODO otp only returned for testing; remove in prod
  }
  
  //   
  async sendOtpNotification(email: string, otp: string, phone?: string | null) {
    // Placeholder: implement your email/SMS provider here
    // Example: send email
    console.log(`[OTP] send to ${email} (phone=${phone}): ${otp}`);
    return true;
  }

  

  // verify OTP - compares plaintext OTP with stored hashed value
  async verifyOtpForEmail(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.otp_code || !user.otp_expires_at) {
      throw new BadRequestException('OTP not requested or user not found');
    }

    if (user.otp_expires_at < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    const valid = await bcrypt.compare(otp, user.otp_code);
    if (!valid) throw new BadRequestException('Invalid OTP');

    // Mark as verified and clear otp fields
    await this.prisma.user.update({
      where: { email },
      data: { is_verified: true, otp_code: null, otp_expires_at: null },
    });

    return true;
  }

  // For login: verify, but DO NOT mark user as verified again (optional)
  async verifyOtpForLoginAndClear(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.otp_code || !user.otp_expires_at) {
      throw new BadRequestException('OTP not requested or user not found');
    }
    if (user.otp_expires_at < new Date()) throw new BadRequestException('OTP expired');
    const valid = await bcrypt.compare(otp, user.otp_code);
    if (!valid) throw new BadRequestException('Invalid OTP');

    // clear otp fields but do not change is_verified here (login OTP)
    await this.prisma.user.update({
      where: { email },
      data: { otp_code: null, otp_expires_at: null },
    });

    return true;
  }
}
