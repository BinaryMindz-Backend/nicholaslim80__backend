 import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Get,
  Query,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';

import { ApiResponses } from 'src/common/apiResponse';
import { NotificationService } from './notification.service';
import { Auth } from 'src/decorators/auth.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import type { IUser } from 'src/types';
import {
  AdminCreateNotificationDto,
  AdminCreatePromotionDto,
  UpdateNotificationDto,
  FindNotificationsDto,
  FindAdminNotificationsDto,
  DeleteNotificationsDto,
  StoreFcmTokenDto,
  ResendNotificationDto,
} from './dto';

@ApiTags('Notification Services')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN – Create Notification (system/transactional alert)
  // ─────────────────────────────────────────────────────────────────────────
  @Post('admin/notification')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.NOTIFICATION, Permission.CREATE)
  @ApiOperation({ summary: 'Admin: create & send a system notification' })
  @ApiBody({ type: AdminCreateNotificationDto })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createNotification(
    @Body() dto: AdminCreateNotificationDto,
    @CurrentUser() admin: IUser,
  ) {
    try {
      const res = await this.notificationService.createNotification(dto, admin);
      return ApiResponses.success(res, 'Notification created successfully');
    } catch (error) {
      return ApiResponses.error(error ?? 'Internal server error', 'Failed to create notification');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN – Legacy broadcast (backwards compat)
  // ─────────────────────────────────────────────────────────────────────────
  @Post('admin/broadcast')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.NOTIFICATION, Permission.CREATE)
  @ApiOperation({ summary: 'Admin: broadcast notification (legacy endpoint)' })
  @ApiBody({ type: AdminCreateNotificationDto })
  @ApiResponse({ status: 201, description: 'Notification created and sent successfully' })
  async broadcast(
    @Body() dto: AdminCreateNotificationDto,
    @CurrentUser() admin: IUser,
  ) {
    try {
      const res = await this.notificationService.broadcast(dto, admin);
      return ApiResponses.success(res, 'Notification created successfully');
    } catch (error) {
      return ApiResponses.error(error ?? 'Internal server error', 'Failed to create notification');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN – Create Promotion
  // ─────────────────────────────────────────────────────────────────────────
  @Post('admin/promotion')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.NOTIFICATION, Permission.CREATE)
  @ApiOperation({ summary: 'Admin: create & send a promotion' })
  @ApiBody({ type: AdminCreatePromotionDto })
  @ApiResponse({ status: 201, description: 'Promotion created successfully' })
  async createPromotion(
    @Body() dto: AdminCreatePromotionDto,
    @CurrentUser() admin: IUser,
  ) {
    try {
      const res = await this.notificationService.createPromotion(dto, admin);
      return ApiResponses.success(res, 'Promotion created successfully');
    } catch (error) {
      return ApiResponses.error(error ?? 'Internal server error', 'Failed to create promotion');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN – Get All (admin view: notifications + promotions)
  // ─────────────────────────────────────────────────────────────────────────
  @Get('admin/list')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.NOTIFICATION, Permission.READ)
  @ApiOperation({ summary: 'Admin: list all notifications / promotions with filters' })
  @ApiResponse({ status: 200, description: 'List fetched successfully' })
  async findAllForAdmin(@Query() query: FindAdminNotificationsDto) {
    try {
      const res = await this.notificationService.findAllForAdmin(query);
      return ApiResponses.success(res, 'Notifications fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch notifications');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN – Log History (audit trail)
  // ─────────────────────────────────────────────────────────────────────────
  @Get('admin/logs')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.NOTIFICATION, Permission.READ)
  @ApiOperation({ summary: 'Admin: get audit log history (filter by category, admin, date)' })
  @ApiResponse({ status: 200, description: 'Logs fetched successfully' })
  async getLogHistory(@Query() query: FindAdminNotificationsDto) {
    try {
      const res = await this.notificationService.getLogHistory(query);
      return ApiResponses.success(res, 'Log history fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch log history');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN – Update a notification / promotion
  // ─────────────────────────────────────────────────────────────────────────
  @Patch('admin/:id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.NOTIFICATION, Permission.UPDATE)
  @ApiOperation({ summary: 'Admin: edit a notification or promotion (logged)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateNotificationDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNotificationDto,
    @CurrentUser() admin: IUser,
  ) {
    try {
      const res = await this.notificationService.update(id, dto, admin);
      return ApiResponses.success(res, 'Notification updated successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to update notification');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN – Resend
  // ─────────────────────────────────────────────────────────────────────────
  @Post('admin/:id/resend')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.NOTIFICATION, Permission.CREATE)
  @ApiOperation({ summary: 'Admin: resend an existing notification' })
  @ApiParam({ name: 'id', type: Number })
  async resend(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResendNotificationDto,
    @CurrentUser() admin: IUser,
  ) {
    try {
      const res = await this.notificationService.resend(id, dto, admin);
      return ApiResponses.success(res, 'Notification resent successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to resend notification');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN – Disable promotion
  // ─────────────────────────────────────────────────────────────────────────
  @Patch('admin/:id/disable')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.NOTIFICATION, Permission.UPDATE)
  @ApiOperation({ summary: 'Admin: disable a promotion' })
  @ApiParam({ name: 'id', type: Number })
  async disablePromotion(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: IUser,
  ) {
    try {
      const res = await this.notificationService.disablePromotion(id, admin);
      return ApiResponses.success(res, 'Promotion disabled successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to disable promotion');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN – Delete one (logged)
  // ─────────────────────────────────────────────────────────────────────────
  @Delete('admin/:id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.NOTIFICATION, Permission.DELETE)
  @ApiOperation({ summary: 'Admin: delete a notification / promotion (logged)' })
  @ApiParam({ name: 'id', type: Number })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: IUser,
  ) {
    try {
      const res = await this.notificationService.delete(id, admin);
      return ApiResponses.success(res, 'Notification deleted successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to delete notification');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN – Delete many (logged)
  // ─────────────────────────────────────────────────────────────────────────
  @Post('admin/delete-many')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.NOTIFICATION, Permission.DELETE)
  @ApiOperation({ summary: 'Admin: delete multiple notifications / promotions (logged)' })
  @ApiBody({ type: DeleteNotificationsDto })
  async deleteMany(
    @Body() dto: DeleteNotificationsDto,
    @CurrentUser() admin: IUser,
  ) {
    try {
      const res = await this.notificationService.deleteMany(dto, admin);
      return ApiResponses.success(res, 'Notifications deleted successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to delete notifications');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // USER – Get own notifications (bell feed, supports category filter)
  // ─────────────────────────────────────────────────────────────────────────
  @Get()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.NOTIFICATION, Permission.READ)
  @ApiOperation({
    summary: 'User: get own notifications (pass category=NOTIFICATION or PROMOTION)',
  })
  @ApiResponse({ status: 200, description: 'Notifications fetched successfully' })
  async findAll(@Query() query: FindNotificationsDto, @CurrentUser() user: IUser) {
    try {
      const res = await this.notificationService.findAll(query, user);
      return ApiResponses.success(res, 'Notifications fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch notifications');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // USER – Unread count (badge on bell icon)
  // ─────────────────────────────────────────────────────────────────────────
  @Get('unread-count')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User: get unread notification count for bell badge' })
  async getUnreadCount(@CurrentUser() user: IUser) {
    try {
      const res = await this.notificationService.getUnreadCount(user);
      return ApiResponses.success(res, 'Unread count fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch unread count');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // USER/ADMIN – Get one by ID
  // ─────────────────────────────────────────────────────────────────────────
  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single notification by ID (includes log history for admin)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const res = await this.notificationService.findOne(id);
      return ApiResponses.success(res, 'Notification fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch notification');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // USER – Mark as read
  // ─────────────────────────────────────────────────────────────────────────
  @Patch(':id/mark-read')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.NOTIFICATION, Permission.UPDATE)
  @ApiOperation({ summary: 'User: mark a notification as read' })
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: IUser,
  ) {
    try {
      const res = await this.notificationService.markAsRead(id, user);
      return ApiResponses.success(res, 'Notification marked as read');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to mark notification as read');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // USER – Store FCM token
  // ─────────────────────────────────────────────────────────────────────────
  @Patch('fcm-token')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User: store / update FCM push token' })
  @ApiBody({ type: StoreFcmTokenDto })
  async storeFcmToken(
    @CurrentUser() user: IUser,
    @Body() dto: StoreFcmTokenDto,
  ) {
    try {
      const res = await this.notificationService.storeFcmToken(user.id, dto.fcmToken);
      return ApiResponses.success(res, 'FCM token stored successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to store FCM token');
    }
  }
}