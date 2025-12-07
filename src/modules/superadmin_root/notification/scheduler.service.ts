// src/notification/scheduler.service.ts
import { Injectable } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationSchedulerService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}
  
  //
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledNotifications() {
    const now = new Date();
    const notifications = await this.prisma.notification.findMany({
      where: {
        send_immediately: false,
        schedule_to_send: { lte: now },
      },
    });
     
    // 
    for (const n of notifications) {
        // 
      const whereRole: Prisma.UserWhereInput = {};
      if (n.target_role === UserRole.USER) whereRole.role = UserRole.USER;
      else if (n.target_role === UserRole.RAIDER) whereRole.role = UserRole.RAIDER;
    //   

        const users = await this.prisma.user.findMany({
            where: whereRole,
            select: { email: true, phone: true, fcmToken: true },
        });
        
          // Convert null values to undefined
            const mappedUsers = users.map(u => ({
            email: u.email ?? undefined,
            phone: u.phone ?? undefined,
            fcmToken: u.fcmToken ?? undefined,
            }));
            

      await this.notificationService.sendNotificationByType(n.type, mappedUsers, n.title!, n.message!);

      await this.prisma.notification.update({
        where: { id: n.id },
        data: { send_immediately: true },
      });
    }
  }
}
