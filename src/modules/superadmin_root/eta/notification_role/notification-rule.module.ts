import { Module } from "@nestjs/common";
import { NotificationRuleController } from "./notification-rule.controller";
import { NotificationRuleService } from "./notification-rule.service";


@Module({
    controllers: [NotificationRuleController],
    providers: [NotificationRuleService],
    exports: [NotificationRuleService],
})
export class NotificationRuleModule { }