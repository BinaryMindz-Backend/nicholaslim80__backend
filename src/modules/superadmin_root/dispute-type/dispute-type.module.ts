import { Module } from '@nestjs/common';
import { DisputeTypeService } from './dispute-type.service';
import { DisputeTypeController } from './dispute-type.controller';

@Module({
  controllers: [DisputeTypeController],
  providers: [DisputeTypeService],
})
export class DisputeTypeModule {}
