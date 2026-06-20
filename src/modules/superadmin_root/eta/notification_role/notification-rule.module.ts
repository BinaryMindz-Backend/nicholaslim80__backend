import { Module } from "@nestjs/common";
import { NotificationRuleController } from "./notification-rule.controller";
import { NotificationRuleService } from "./notification-rule.service";
import { NotificationRuleEngineService } from "./notification_role.engine";
import { QueueModule } from "src/modules/queue/queue.module";


@Module({
    imports: [
        QueueModule
    ],
    controllers: [NotificationRuleController],
    providers: [NotificationRuleService, NotificationRuleEngineService],
    exports: [NotificationRuleService, NotificationRuleEngineService],
})
export class NotificationRuleModule { }