import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/core/database/prisma.service';
import { NotificationService } from './notification.service';
import { NotificationSentRole, Prisma, UserRole } from '@prisma/client';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleScheduledNotifications() {
    const now = new Date();

    // ── Find all scheduled notifications that are due and not yet sent ──────
    const notifications = await this.prisma.notification.findMany({
      where: {
        send_immediately: false,
        schedule_to_send: { lte: now },
        is_active: true,
        // Treat send_immediately=false as "not sent yet"
      },
    });

    if (notifications.length === 0) return;

    this.logger.log(`Scheduler: ${notifications.length} notification(s) to process`);

    for (const n of notifications) {
      try {
        // ── Resolve recipients ─────────────────────────────────────────────
        let users: { email?: string; phone?: string; fcmToken?: string }[] = [];

        if (n.target_user_ids.length > 0) {
          // Specific user / driver IDs
          const records = await this.prisma.user.findMany({
            where: { id: { in: n.target_user_ids } },
            select: { email: true, phone: true, fcmToken: true },
          });
          users = records.map((u) => ({
            email: u.email ?? undefined,
            phone: u.phone ?? undefined,
            fcmToken: u.fcmToken ?? undefined,
          }));
        } else {
          // Role-based broadcast
          const roleMap: Partial<Record<NotificationSentRole, UserRole>> = {
            [NotificationSentRole.USER]: UserRole.USER,
            [NotificationSentRole.RAIDER]: UserRole.RAIDER,
          };

          const whereRole: Prisma.UserWhereInput =
            n.target_role && roleMap[n.target_role]
              ? { roles: { some: { name: roleMap[n.target_role] } } }
              : {}; // ALL

          const records = await this.prisma.user.findMany({
            where: whereRole,
            select: { email: true, phone: true, fcmToken: true },
          });

          users = records.map((u) => ({
            email: u.email ?? undefined,
            phone: u.phone ?? undefined,
            fcmToken: u.fcmToken ?? undefined,
          }));
        }

        this.logger.log(
          `Sending notification ID=${n.id}, type=${n.type}, category=${n.category}, to ${users.length} user(s)`,
        );

        await this.notificationService.sendNotificationByType(
          n.type,
          users,
          n.title ?? undefined,
          n.message ?? undefined,
          n.image_url ?? undefined,
        );

        // ── Mark as sent (flip send_immediately = true so scheduler skips it) ──
        await this.prisma.notification.update({
          where: { id: n.id },
          data: { send_immediately: true },
        });

        this.logger.log(`Notification ID=${n.id} sent and marked as processed`);
      } catch (error) {
        this.logger.error(
          `Failed to send notification ID=${n.id}`,
          (error as Error).stack,
        );
      }
    }
  }

  // ── Deactivate expired promotions ────────────────────────────────────────
  @Cron(CronExpression.EVERY_HOUR)
  async deactivateExpiredPromotions() {
    const now = new Date();

    const result = await this.prisma.notification.updateMany({
      where: {
        expiry_date: { lte: now },
        is_active: true,
      },
      data: { is_active: false },
    });

    if (result.count > 0) {
      this.logger.log(`Deactivated ${result.count} expired promotion(s)`);
    }
  }
}