import { Module } from '@nestjs/common';
import { MyRaiderService } from './my_raider.service';
import { MyRaiderController } from './my_raider.controller';

@Module({
  controllers: [MyRaiderController],
  providers: [MyRaiderService],
})
export class MyRaiderModule {}
