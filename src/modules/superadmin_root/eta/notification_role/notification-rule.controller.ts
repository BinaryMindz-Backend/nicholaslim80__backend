import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';

import { AVAILABLE_MERGE_TAGS, NotificationRuleService } from './notification-rule.service';
import { CreateNotificationRuleDto } from './dto/create-notification-rule.dto';
import { UpdateNotificationRuleDto } from './dto/update-notification-rule.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import type { IUser } from 'src/types';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ApiResponses } from 'src/common/apiResponse';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { Public } from 'src/decorators/public.decorator';


@ApiTags('Notification Rules')
@Controller('admin/notification-rules')
@ApiBearerAuth()
export class NotificationRuleController {
    constructor(private readonly service: NotificationRuleService) { }

    @Get('merge-tags')
    @Public()
    @ApiOperation({ summary: 'Get available merge tags' })
    getAvailableMergeTags() {
        return AVAILABLE_MERGE_TAGS;
    }

    @Post()
    @Auth()
    @ApiBearerAuth()
    @RequirePermission(Module.NOTIFICATION_RULE, Permission.CREATE)
    @ApiOperation({ summary: 'Create notification rule' })
    async create(
        @Body() dto: CreateNotificationRuleDto,
        @CurrentUser() user: IUser,
    ) {
        try {
            const data = await this.service.create(dto, user.id);

            return ApiResponses.success(
                data,
                'Notification rule created successfully',
            );
        } catch (error) {
            return ApiResponses.error(error);
        }
    }

    @Get()
    @Auth()
    @ApiBearerAuth()
    @RequirePermission(Module.NOTIFICATION_RULE, Permission.READ)
    @ApiOperation({ summary: 'Get all notification rules' })
    async findAll() {
        try {
            const data = await this.service.findAll();

            return ApiResponses.success(
                data,
                'Notification rules fetched successfully',
            );
        } catch (error) {
            return ApiResponses.error(error);
        }
    }

    @Get(':id')
    @Auth()
    @ApiBearerAuth()
    @RequirePermission(Module.NOTIFICATION_RULE, Permission.READ)
    @ApiOperation({ summary: 'Get notification rule details' })
    async findOne(@Param('id') id: string) {
        try {
            const data = await this.service.findOne(id);

            return ApiResponses.success(
                data,
                'Notification rule fetched successfully',
            );
        } catch (error) {
            return ApiResponses.error(error);
        }
    }

    @Patch(':id')
    @Auth()
    @ApiBearerAuth()
    @RequirePermission(Module.NOTIFICATION_RULE, Permission.UPDATE)
    @ApiOperation({ summary: 'Update notification rule' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateNotificationRuleDto,
        @CurrentUser() user: IUser,
    ) {
        try {
            const data = await this.service.update(id, dto, user.id);

            return ApiResponses.success(
                data,
                'Notification rule updated successfully',
            );
        } catch (error) {
            return ApiResponses.error(error);
        }
    }

    @Patch(':id/toggle')
    @Auth()
    @ApiBearerAuth()
    @RequirePermission(Module.NOTIFICATION_RULE, Permission.UPDATE)
    @ApiOperation({ summary: 'Toggle notification rule status' })
    async toggleActive(
        @Param('id') id: string,
        @CurrentUser() user: IUser,
    ) {
        try {
            const data = await this.service.toggleActive(id, user.id);

            return ApiResponses.success(
                data,
                'Notification rule status updated successfully',
            );
        } catch (error) {
            return ApiResponses.error(error);
        }
    }

    @Delete(':id')
    @Auth()
    @ApiBearerAuth()
    @RequirePermission(Module.NOTIFICATION_RULE, Permission.DELETE)
    @ApiOperation({ summary: 'Delete notification rule' })
    async remove(
        @Param('id') id: string,
        @CurrentUser() user: IUser,
    ) {
        try {
            const data = await this.service.remove(id, user.id);

            return ApiResponses.success(
                data,
                'Notification rule deleted successfully',
            );
        } catch (error) {
            return ApiResponses.error(error);
        }
    }


}