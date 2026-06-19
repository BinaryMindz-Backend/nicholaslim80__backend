import { Module } from "@nestjs/common";
import { TriggerEventController } from "./trigger-event.controller";
import { TriggerEventService } from "./trigger-event.service";


@Module({
    controllers: [TriggerEventController],
    providers: [TriggerEventService],
    exports: [TriggerEventService],
})
export class TriggerEventModule { }