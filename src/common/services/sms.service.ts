/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import Twilio from 'twilio';

@Injectable()
export class SmsService {
  private client;

  constructor() {
    this.client = Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  async send({ to, message }: { to: string; message: string }) {

   const res = await this.client.messages.create({
      to,
      from: process.env.TWILIO_PHONE,
      body: message,
      
    });
    // 
    return res
  }
}
