import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendMail({
    to,
    subject,
    text,
    templateName = 'default',
    context = {},
  }: {
    to: string;
    subject: string;
    text?: string;
    templateName?: string;
    context?: Record<string, any>;
  }): Promise<any> {
    let html: string | null = null;

    // Production-safe template path
    const templatePath = path.join(
      process.cwd(),
      'src/common/services/templates',
      `${templateName}.html`,
    );

    if (fs.existsSync(templatePath)) {
      html = fs.readFileSync(templatePath, 'utf-8');

      Object.entries(context).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        html = html!.replace(regex, String(value));
      });

      // fallback plain text if not provided
      if (!text) {
        text = html.replace(/<[^>]+>/g, '');
      }
    }

    // Await fixes TS warning
    return await this.transporter.sendMail({
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    });
  }
}
