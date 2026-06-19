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

import { TriggerEventService } from './trigger-event.service';
import { CreateTriggerEventDto } from './dto/create-trigger-event.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';
import { ApiResponses } from 'src/common/apiResponse';
import { UpdateTriggerEventDto } from './dto/ update-trigger-event.dto';
import { Module, Permission } from 'src/rbac/rbac.constants';


@ApiTags('Trigger Events')
@Controller('admin/trigger-events')
@ApiBearerAuth()
export class TriggerEventController {
    constructor(private readonly service: TriggerEventService) { }

    @Post()
    @Auth()
    @ApiBearerAuth()
    @RequirePermission(Module.ETA, Permission.CREATE)
    @ApiOperation({ summary: 'Create trigger event' })
    async create(
        @Body() dto: CreateTriggerEventDto,
        @CurrentUser() user: IUser,
    ) {
        try {
            const data = await this.service.create(dto, user.id);

            return ApiResponses.success(
                data,
                'Trigger event created successfully',
            );
        } catch (error) {
            return ApiResponses.error(error);
        }
    }

    @Get()
    @Auth()
    @ApiBearerAuth()
    @RequirePermission(Module.ETA, Permission.READ)
    @ApiOperation({ summary: 'Get all trigger events' })
    async findAll() {
        try {
            const data = await this.service.findAll();

            return ApiResponses.success(
                data,
                'Trigger events fetched successfully',
            );
        } catch (error) {
            return ApiResponses.error(error);
        }
    }

    @Get(':id')
    @Auth()
    @ApiBearerAuth()
    @RequirePermission(Module.ETA, Permission.READ)
    @ApiOperation({ summary: 'Get trigger event by ID' })
    async findOne(@Param('id') id: string) {
        try {
            const data = await this.service.findOne(id);

            return ApiResponses.success(
                data,
                'Trigger event fetched successfully',
            );
        } catch (error) {
            return ApiResponses.error(error);
        }
    }

    @Patch(':id')
    @Auth()
    @ApiBearerAuth()
    @RequirePermission(Module.ETA, Permission.UPDATE)
    @ApiOperation({ summary: 'Update trigger event' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateTriggerEventDto,
        @CurrentUser() user: IUser,
    ) {
        try {
            const data = await this.service.update(id, dto, user.id);

            return ApiResponses.success(
                data,
                'Trigger event updated successfully',
            );
        } catch (error) {
            return ApiResponses.error(error);
        }
    }

    @Patch(':id/toggle')
    @Auth()
    @ApiBearerAuth()
    @RequirePermission(Module.ETA, Permission.UPDATE)
    @ApiOperation({ summary: 'Toggle trigger event status' })
    async toggleActive(
        @Param('id') id: string,
        @CurrentUser() user: IUser,
    ) {
        try {
            const data = await this.service.toggleActive(id, user.id);

            return ApiResponses.success(
                data,
                'Trigger event status updated successfully',
            );
        } catch (error) {
            return ApiResponses.error(error);
        }
    }

    @Delete(':id')
    @Auth()
    @ApiBearerAuth()
    @RequirePermission(Module.ETA, Permission.DELETE)
    @ApiOperation({ summary: 'Delete trigger event' })
    async remove(
        @Param('id') id: string,
        @CurrentUser() user: IUser,
    ) {
        try {
            const data = await this.service.remove(id, user.id);

            return ApiResponses.success(
                data,
                'Trigger event deleted successfully',
            );
        } catch (error) {
            return ApiResponses.error(error);
        }
    }
}