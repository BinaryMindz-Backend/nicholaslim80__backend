import { PartialType, ApiExtraModels } from '@nestjs/swagger';
import { CreateNotificationRuleDto } from './create-notification-rule.dto';

@ApiExtraModels(CreateNotificationRuleDto)
export class UpdateNotificationRuleDto extends PartialType(CreateNotificationRuleDto) { }