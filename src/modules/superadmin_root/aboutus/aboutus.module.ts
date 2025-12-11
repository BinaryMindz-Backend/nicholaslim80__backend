import { Module } from '@nestjs/common';
import { AboutusService } from './aboutus.service';
import { AboutusController } from './aboutus.controller';

@Module({
  controllers: [AboutusController],
  providers: [AboutusService],
})
export class AboutusModule {}
