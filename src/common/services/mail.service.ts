/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class MailService {
  private transporter;
  private templatesDir: string;
  private logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
       tls: {
    rejectUnauthorized: false
  }
    });

    // Dynamic template folder detection
    const devPath = path.join(process.cwd(), 'src/common/services/templates/emails');
    const prodPath = path.join(process.cwd(), 'dist/src/common/services/templates/emails');
    console.log("from mail services -->", devPath, prodPath);
    if (fs.existsSync(devPath)) this.templatesDir = devPath;
    else if (fs.existsSync(prodPath)) this.templatesDir = prodPath;
    else throw new Error('Templates folder not found');
  }

  /**
   * Send email using a Handlebars template
   * @param templateName Template file name (without .hbs)
   * @param to Recipient email
   * @param subject Email subject
   * @param data Dynamic data for the template
   */
  async sendTemplateMail(
    templateName: string,
    to: string,
    subject: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
      console.log(templatePath);
      if (!fs.existsSync(templatePath)) {
        this.logger.error(`Template not found: ${templateName} at ${templatePath}`);
        throw new Error(`Template not found: ${templateName}`);
      }

      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const compiled = Handlebars.compile(templateContent);
      const html = compiled(data);

      await this.transporter.sendMail({ to, subject, html });

      this.logger.log(`Email sent to ${to} using template ${templateName}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err as any);
      throw err;
    }
  }
}
