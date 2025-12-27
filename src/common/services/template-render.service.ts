/* eslint-disable @typescript-eslint/no-unsafe-return */
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TemplateRenderService {
  private templateBasePath = path.join(__dirname, 'templates', 'emails');

  render(templateName: string, data: any): string {
    const filePath = path.join(this.templateBasePath, `${templateName}.hbs`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Email template ${templateName} not found`);
    }

    const templateContent = fs.readFileSync(filePath, 'utf-8');
    const template = handlebars.compile(templateContent);

    return template(data);
  }
}
