import { ApiResponses } from 'src/common/apiResponse';
import { Controller, Post, Body, Patch, Param, Get, Query, Delete } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AdminCreateNotificationDto } from './dto/create-notification.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/decorators/auth.decorator';
import { FindNotificationsDto } from './dto/find-notifications.dto';
import { DeleteNotificationsDto } from './dto/delete-notifications.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import  type { IUser } from 'src/types';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { Public } from 'src/decorators/public.decorator';


//
@ApiTags("Notification services")
@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}
   

  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @RequirePermission(Module.NOTIFICATION, Permission.CREATE)
  @Post('admin/broadcast')
  @ApiOperation({ summary: 'Create a new notification and send (admin only)' })
  @ApiBody({ type: AdminCreateNotificationDto })
  @ApiResponse({
      status: 201,
      description: 'Notification created  and send successfully',
    })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async broadcast(@Body() dto: AdminCreateNotificationDto) {
  try {
    const res = await this.notificationService.broadcast(dto);
    return ApiResponses.success(res, 'Notification created successfully');
  } catch (error) {
    console.error('Broadcast error:', error); 
    return ApiResponses.error(error?.message ?? 'Internal server error', "Failed to create notification");
  }
}
  // get all
  @Get()
  @Auth()
  // @Roles(UserRole.USER, UserRole.RAIDER)
  @RequirePermission(Module.NOTIFICATION, Permission.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ status: 200, description: 'Notifications fetched successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(@Query() query: FindNotificationsDto, @CurrentUser() user:IUser) {
    try {
      const res = await this.notificationService.findAll(query,user);
      return ApiResponses.success(res, 'Notifications fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch notifications');
    }
  }

  @Get(':id')
  @Auth()
  @Public()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a notification by ID' })
  @ApiResponse({ status: 200, description: 'Notification fetched successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findOne(@Param('id') id: string) {
    try {
      const res = await this.notificationService.findOne(+id);
      return ApiResponses.success(res, 'Notification fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch notification');
    }
  }
  
  @Patch(':id/mark-read')
  @Auth()
  // @Roles(UserRole.USER, UserRole.RAIDER)
  @RequirePermission(Module.NOTIFICATION, Permission.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user:IUser) {
    try {
      const res = await this.notificationService.markAsRead(+id, user);
      return ApiResponses.success(res, 'Notification marked as read');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to mark notification as read');
    }
  }

  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.NOTIFICATION, Permission.DELETE)
  @ApiOperation({ summary: 'Delete a notification by ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async delete(@Param('id') id: string) {
    try {
      const res = await this.notificationService.delete(+id);
      return ApiResponses.success(res, 'Notification deleted successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to delete notification');
    }
  }

  @Post('delete-many')
  @Auth()
  @ApiBearerAuth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.NOTIFICATION, Permission.DELETE)
  @ApiOperation({ summary: 'Delete multiple notifications' })
  @ApiResponse({ status: 200, description: 'Notifications deleted successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteMany(@Body() dto: DeleteNotificationsDto) {
    try {
      const res = await this.notificationService.deleteMany(dto);
      return ApiResponses.success(res, 'Notifications deleted successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to delete notifications');
    }
  }
  // store fcm token
  @Patch('fcm-token')
  @Auth()
  // @Roles(UserRole.USER, UserRole.RAIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Store FCM token for a user' })
  @ApiResponse({ status: 200, description: 'FCM token stored successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiBody({ schema: { type: 'object', properties: { fcmToken: { type: 'string' } }, required: ['fcmToken'] } })
  async storeFcmToken(@CurrentUser() user:IUser , @Body() dto: { fcmToken: string }) {
    try {
      const res = await this.notificationService.storeFcmToken(user.id, dto.fcmToken);
      return ApiResponses.success(res, 'FCM token stored successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to store FCM token');
    }
  }

}