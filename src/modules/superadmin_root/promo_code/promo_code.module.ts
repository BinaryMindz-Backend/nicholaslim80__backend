import { Module } from '@nestjs/common';
import { PromoCodeService } from './promo_code.service';
import { PromoCodeController } from './promo_code.controller';

@Module({
  controllers: [PromoCodeController],
  providers: [PromoCodeService],
})
export class PromoCodeModule {}
