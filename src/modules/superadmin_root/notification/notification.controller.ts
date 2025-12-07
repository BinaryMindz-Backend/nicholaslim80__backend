import { ApiResponses } from 'src/common/apiResponse';
import { Controller, Post, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AdminCreateNotificationDto } from './dto/create-notification.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';


//
@ApiTags("Notification services")
@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Roles(UserRole.SUPER_ADMIN)
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
    console.error('Broadcast error:', error); // log full error
    return ApiResponses.error(error?.message ?? 'Internal server error', "Failed to create notification");
  }
}

}
