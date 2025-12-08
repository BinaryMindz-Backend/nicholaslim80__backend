/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";
import { NotificationService } from "./notification.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Prisma, UserRole } from "@prisma/client";

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledNotifications() {
    const now = new Date();
    this.logger.log(`Cron running at ${now.toISOString()}`);

    const notifications = await this.prisma.notification.findMany({
      where: {
        send_immediately: false,
        schedule_to_send: { lte: now },
      },
    });
    //  
    this.logger.log(`${notifications.length} notifications to process`);

    for (const n of notifications) {
      const whereRole: Prisma.UserWhereInput = {};
      if (n.target_role === UserRole.USER) whereRole.role = UserRole.USER;
      else if (n.target_role === UserRole.RAIDER) whereRole.role = UserRole.RAIDER;

      const users = await this.prisma.user.findMany({
        where: whereRole,
        select: { email: true, phone: true, fcmToken: true },
      });

      const mappedUsers = users.map(u => ({
        email: u.email ?? undefined,
        phone: u.phone ?? undefined,
        fcmToken: u.fcmToken ?? undefined,
      }));

      this.logger.log(`Sending notification ID=${n.id}, type=${n.type}, to ${mappedUsers.length} users`);

      try {
        await this.notificationService.sendNotificationByType(n.type, mappedUsers, n.title!, n.message!);
        this.logger.log(`Notification ID=${n.id} sent successfully`);
      } catch (error) {
        this.logger.error(`Failed to send notification ID=${n.id}`, error as any);
      }

      await this.prisma.notification.update({
        where: { id: n.id },
        data: { send_immediately: true },
      });
    }
  }
}
