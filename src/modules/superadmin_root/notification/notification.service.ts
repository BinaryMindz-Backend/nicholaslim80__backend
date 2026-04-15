import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  NotificationType,
  NotificationCategory,
  NotificationSentRole,
  LogAction,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { FirebaseService } from './firebase.service';
import { MailService } from 'src/common/services/mail.service';
import { SmsService } from 'src/common/services/sms.service';
import { IUser } from 'src/types';
import {
  AdminCreateNotificationDto,
  AdminCreatePromotionDto,
  UpdateNotificationDto,
  FindNotificationsDto,
  FindAdminNotificationsDto,
  DeleteNotificationsDto,
  ResendNotificationDto,
} from './dto/index';

// ─── Types ───────────────────────────────────────────────────────────────────
type SendTarget = { email?: string; phone?: string; fcmToken?: string };

@Injectable()
export class NotificationService {
  // notification types admin is allowed to broadcast
  private readonly ADMIN_ALLOWED_TYPES: NotificationType[] = [
    NotificationType.PUSH_NOTIFICATION,
    NotificationType.EMAIL,
    NotificationType.SMS,
    NotificationType.WEB_ANNOUNCEMENT,
    NotificationType.IN_APP,
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly fcmService: FirebaseService,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Resolve recipients from target_user_ids (specific) or target_role (broadcast).
   * Returns mapped array + raw userIds for targeted sends.
   */
  private async resolveTargets(dto: {
    target_user_ids?: number[];
    target_role?: NotificationSentRole;
  }): Promise<{ users: SendTarget[]; userIds: number[] }> {
    // ── Specific user / driver IDs ──────────────────────────────────────────
    if (dto.target_user_ids && dto.target_user_ids.length > 0) {
      const records = await this.prisma.user.findMany({
        where: { id: { in: dto.target_user_ids } },
        select: { id: true, email: true, phone: true, fcmToken: true },
      });

      if (records.length === 0) {
        throw new BadRequestException('None of the specified user IDs were found');
      }

      return {
        users: records.map((u) => ({
          email: u.email ?? undefined,
          phone: u.phone ?? undefined,
          fcmToken: u.fcmToken ?? undefined,
        })),
        userIds: records.map((u) => u.id),
      };
    }

    // ── Role-based broadcast ────────────────────────────────────────────────
    const roleMap: Partial<Record<NotificationSentRole, UserRole>> = {
      [NotificationSentRole.USER]: UserRole.USER,
      [NotificationSentRole.RAIDER]: UserRole.RAIDER,
    };

    const whereRole: Prisma.UserWhereInput =
      dto.target_role && roleMap[dto.target_role]
        ? { roles: { some: { name: roleMap[dto.target_role] } } }
        : {}; // ALL users when target_role is ALL or undefined

    const records = await this.prisma.user.findMany({
      where: whereRole,
      select: { id: true, email: true, phone: true, fcmToken: true },
    });

    if (records.length === 0) {
      throw new BadRequestException('No users found for the specified target');
    }

    return {
      users: records.map((u) => ({
        email: u.email ?? undefined,
        phone: u.phone ?? undefined,
        fcmToken: u.fcmToken ?? undefined,
      })),
      userIds: records.map((u) => u.id),
    };
  }

  /** Write a log entry for audit trail */
  private async writeLog(data: {
    notificationId: number;
    adminId: number;
    action: LogAction;
    category: NotificationCategory;
    title?: string;
    previousMessage?: string;
    newMessage?: string;
    note?: string;
  }) {
    return this.prisma.notificationLog.create({
      data: {
        notificationId: data.notificationId,
        adminId: data.adminId,
        action: data.action,
        category: data.category,
        title: data.title,
        previous_message: data.previousMessage,
        new_message: data.newMessage,
        note: data.note,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SEND ENGINE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Core dispatcher – send notifications by type.
   * Called both for immediate sends and by the scheduler.
   */
  public async sendNotificationByType(
    type: NotificationType,
    users: SendTarget[],
    title?: string,
    message?: string,
    imageUrl?: string,
  ): Promise<void> {
    switch (type) {
      // ── Push ───────────────────────────────────────────────────────────────
      case NotificationType.PUSH_NOTIFICATION: {
        const targets = users.filter((u) => !!u.fcmToken);
        if (targets.length === 0) break;
        await Promise.allSettled(
          targets.map((u) =>
            this.fcmService.sendPush({
              token: u.fcmToken!,
              title,
              body: message ?? '',
              imageUrl,
            }),
          ),
        );
        break;
      }

      // ── Email ──────────────────────────────────────────────────────────────
      case NotificationType.EMAIL: {
        const targets = users.filter((u) => !!u.email);
        if (targets.length === 0) break;
        await Promise.allSettled(
          targets.map((u) =>
            this.mailService.sendTemplateMail(
              'plain-text',
              u.email!,
              title!,
              { text: message!, imageUrl },
            ),
          ),
        );
        break;
      }

      // ── SMS ────────────────────────────────────────────────────────────────
      case NotificationType.SMS: {
        const targets = users.filter((u) => !!u.phone);
        if (targets.length === 0) break;
        await Promise.allSettled(
          targets.map((u) =>
            this.smsService.send({ to: u.phone!, message: message! }),
          ),
        );
        break;
      }

      // ── In-App / Web Announcement – nothing to dispatch externally ─────────
      case NotificationType.IN_APP:
      case NotificationType.WEB_ANNOUNCEMENT:
        // These are stored in DB and fetched by the client. No external send needed.
        break;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ① CREATE NOTIFICATION  (system/transactional alert)
  // ─────────────────────────────────────────────────────────────────────────
  async createNotification(dto: AdminCreateNotificationDto, admin: IUser) {
    if (!this.ADMIN_ALLOWED_TYPES.includes(dto.type ?? NotificationType.IN_APP)) {
      throw new BadRequestException('Invalid notification type');
    }

    const { users, userIds } = await this.resolveTargets(dto);

    const notification = await this.prisma.notification.create({
      data: {
        type: dto.type ?? NotificationType.IN_APP,
        category: NotificationCategory.NOTIFICATION,
        title: dto.title,
        message: dto.message,
        send_immediately: dto.send_immediately ?? true,
        schedule_to_send: dto.schedule_to_send ? new Date(dto.schedule_to_send) : null,
        target_role: dto.target_role ?? null,
        target_user_ids: userIds,
        orderId: dto.orderId ?? null,
        is_from_admin: true,
        is_active: true,
      },
    });

    // Write audit log
    await this.writeLog({
      notificationId: notification.id,
      adminId: admin.id,
      action: LogAction.CREATED,
      category: NotificationCategory.NOTIFICATION,
      title: dto.title,
      newMessage: dto.message,
    });

    if (dto.send_immediately) {
      await this.sendNotificationByType(
        notification.type,
        users,
        notification.title ?? undefined,
        notification.message ?? undefined,
      );
    }

    return {
      notificationId: notification.id,
      usersCount: users.length,
      type: notification.type,
      category: notification.category,
      sendImmediately: notification.send_immediately,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ② CREATE PROMOTION
  // ─────────────────────────────────────────────────────────────────────────
  async createPromotion(dto: AdminCreatePromotionDto, admin: IUser) {
    const { users, userIds } = await this.resolveTargets({
      target_user_ids: dto.target_user_ids,
      target_role: dto.target_role,
    });

    const notification = await this.prisma.notification.create({
      data: {
        type: dto.push_notification
          ? NotificationType.PUSH_NOTIFICATION
          : NotificationType.IN_APP,
        category: NotificationCategory.PROMOTION,
        title: dto.title,
        message: dto.message,
        image_url: dto.image_url ?? null,
        send_immediately: dto.send_immediately ?? true,
        schedule_to_send: dto.schedule_to_send ? new Date(dto.schedule_to_send) : null,
        expiry_date: dto.expiry_date ? new Date(dto.expiry_date) : null,
        target_role: dto.target_role ?? null,
        target_user_ids: userIds,
        is_from_admin: true,
        is_active: true,
      },
    });

    await this.writeLog({
      notificationId: notification.id,
      adminId: admin.id,
      action: LogAction.CREATED,
      category: NotificationCategory.PROMOTION,
      title: dto.title,
      newMessage: dto.message,
    });

    if (dto.send_immediately && dto.push_notification) {
      await this.sendNotificationByType(
        NotificationType.PUSH_NOTIFICATION,
        users,
        notification.title ?? undefined,
        notification.message ?? undefined,
        notification.image_url ?? undefined,
      );
    }

    return {
      notificationId: notification.id,
      usersCount: users.length,
      category: NotificationCategory.PROMOTION,
      sendImmediately: notification.send_immediately,
      expiryDate: notification.expiry_date,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ③ LEGACY broadcast (kept for backwards compatibility)
  // ─────────────────────────────────────────────────────────────────────────
  async broadcast(dto: AdminCreateNotificationDto, admin: IUser) {
    return this.createNotification(dto, admin);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ④ UPDATE (edit) – logs previous vs new message
  // ─────────────────────────────────────────────────────────────────────────
  async update(id: number, dto: UpdateNotificationDto, admin: IUser) {
    const existing = await this.prisma.notification.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Notification not found');

    const scheduleChanged =
      dto.schedule_to_send &&
      existing.schedule_to_send?.toISOString() !==
        new Date(dto.schedule_to_send).toISOString();

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        message: dto.message ?? existing.message,
        image_url: dto.image_url ?? existing.image_url,
        send_immediately: dto.send_immediately ?? existing.send_immediately,
        schedule_to_send: dto.schedule_to_send
          ? new Date(dto.schedule_to_send)
          : existing.schedule_to_send,
        expiry_date: dto.expiry_date
          ? new Date(dto.expiry_date)
          : existing.expiry_date,
        is_active: dto.is_active ?? existing.is_active,
      },
    });

    // Determine action for log
    const action = scheduleChanged
      ? LogAction.RESCHEDULED
      : dto.is_active === false
      ? LogAction.DISABLED
      : LogAction.EDITED;

    await this.writeLog({
      notificationId: id,
      adminId: admin.id,
      action,
      category: existing.category,
      title: updated.title ?? undefined,
      previousMessage: existing.message ?? undefined,
      newMessage: updated.message ?? undefined,
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ⑤ RESEND
  // ─────────────────────────────────────────────────────────────────────────
  async resend(id: number, dto: ResendNotificationDto, admin: IUser) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (!notification.is_active) throw new ForbiddenException('Notification is disabled');

    const type = dto.type ?? notification.type;

    // Re-resolve targets (handles both specific IDs and roles)
    const { users } = notification.target_user_ids.length > 0
      ? await this.resolveTargets({ target_user_ids: notification.target_user_ids })
      : await this.resolveTargets({ target_role: notification.target_role ?? undefined });

    await this.sendNotificationByType(
      type,
      users,
      notification.title ?? undefined,
      notification.message ?? undefined,
      notification.image_url ?? undefined,
    );

    await this.writeLog({
      notificationId: id,
      adminId: admin.id,
      action: LogAction.RESENT,
      category: notification.category,
      title: notification.title ?? undefined,
    });

    return { message: `Notification re-sent to ${users.length} users`, usersCount: users.length };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ⑥ DISABLE PROMOTION
  // ─────────────────────────────────────────────────────────────────────────
  async disablePromotion(id: number, admin: IUser) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.category !== NotificationCategory.PROMOTION) {
      throw new BadRequestException('Only promotions can be disabled');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { is_active: false },
    });

    await this.writeLog({
      notificationId: id,
      adminId: admin.id,
      action: LogAction.DISABLED,
      category: NotificationCategory.PROMOTION,
      title: notification.title ?? undefined,
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ⑦ FIND ALL – for user (bell icon feed)
  // ─────────────────────────────────────────────────────────────────────────
  async findAll(dto: FindNotificationsDto, user: IUser) {
    const page = Number(dto.page ?? 1);
    const limit = Number(dto.limit ?? 10);
    const skip = (page - 1) * limit;

    const now = new Date();

    const where: Prisma.NotificationWhereInput = {
      is_active: true,
      AND: [
        // Only non-expired
        {
          OR: [{ expiry_date: null }, { expiry_date: { gte: now } }],
        },
        // Audience match
        {
          OR: [
            // Broadcast to all
            { target_role: null, target_user_ids: { isEmpty: true } },
            // Role-based
            {
              target_role: (user.roles?.[0]?.name as NotificationSentRole) ?? null,
              target_user_ids: { isEmpty: true },
            },
            // Direct target
            { target_user_ids: { has: user.id } },
          ],
        },
      ],
    };

    if (dto.type) (where as any).type = dto.type;
    if (dto.category) (where as any).category = dto.category;

    if (dto.isRead !== undefined) {
      (where as any).AND.push({
        OR: [
          { userId: user.id, is_read: dto.isRead === 'true' },
          {
            userId: null,
            mark_as_read_id:
              dto.isRead === 'true'
                ? { has: user.id }
                : { isEmpty: false }, // not read
          },
        ],
      });
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    // Attach isRead flag per notification for easy client rendering
    const enriched = data.map((n) => ({
      ...n,
      isReadByUser: n.userId != null ? n.is_read : n.mark_as_read_id.includes(user.id),
    }));

    return { data: enriched, total, page, limit };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ⑧ FIND ALL – for admin (notification list)
  // ─────────────────────────────────────────────────────────────────────────
  async findAllForAdmin(dto: FindAdminNotificationsDto) {
    const page = Number(dto.page ?? 1);
    const limit = Number(dto.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      is_from_admin: true,
    };

    if (dto.type) where.type = dto.type;
    if (dto.category) where.category = dto.category;

    if (dto.dateFrom || dto.dateTo) {
      where.created_at = {
        ...(dto.dateFrom ? { gte: new Date(dto.dateFrom) } : {}),
        ...(dto.dateTo ? { lte: new Date(dto.dateTo) } : {}),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ⑨ FIND ONE
  // ─────────────────────────────────────────────────────────────────────────
  async findOne(id: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: { logs: { include: { admin: { select: { id: true, email: true } } } } },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ⑩ MARK AS READ
  // ─────────────────────────────────────────────────────────────────────────
  async markAsRead(id: number, user: IUser) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');

    // user-specific notification → use is_read flag
    if (notification.userId === user.id) {
      return this.prisma.notification.update({
        where: { id },
        data: { is_read: true },
      });
    }

    // broadcast / role notification → push userId into mark_as_read_id array
    if (!notification.mark_as_read_id.includes(user.id)) {
      return this.prisma.notification.update({
        where: { id },
        data: { mark_as_read_id: { push: user.id } },
      });
    }

    return notification; // already marked
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ⑪ DELETE ONE
  // ─────────────────────────────────────────────────────────────────────────
  async delete(id: number, admin: IUser) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');

    await this.writeLog({
      notificationId: id,
      adminId: admin.id,
      action: LogAction.DELETED,
      category: notification.category,
      title: notification.title ?? undefined,
      previousMessage: notification.message ?? undefined,
    });

    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted successfully' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ⑫ DELETE MANY
  // ─────────────────────────────────────────────────────────────────────────
  async deleteMany(dto: DeleteNotificationsDto, admin: IUser) {
    const { ids } = dto;

    const records = await this.prisma.notification.findMany({
      where: { id: { in: ids } },
      select: { id: true, category: true, title: true },
    });

    // Bulk log
    await this.prisma.notificationLog.createMany({
      data: records.map((r) => ({
        notificationId: r.id,
        adminId: admin.id,
        action: LogAction.DELETED,
        category: r.category,
        title: r.title,
      })),
    });

    await this.prisma.notification.deleteMany({ where: { id: { in: ids } } });
    return { message: `${ids.length} notification(s) deleted successfully` };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ⑬ LOG HISTORY (admin audit)
  // ─────────────────────────────────────────────────────────────────────────
  async getLogHistory(dto: FindAdminNotificationsDto) {
    const page = Number(dto.page ?? 1);
    const limit = Number(dto.limit ?? 20);
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationLogWhereInput = {};

    if (dto.category) where.category = dto.category;
    if (dto.adminId) where.adminId = dto.adminId;
    if (dto.dateFrom || dto.dateTo) {
      where.created_at = {
        ...(dto.dateFrom ? { gte: new Date(dto.dateFrom) } : {}),
        ...(dto.dateTo ? { lte: new Date(dto.dateTo) } : {}),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where,
        include: {
          admin: { select: { id: true, email: true } },
          notification: { select: { id: true, title: true, category: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notificationLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ⑭ STORE FCM TOKEN
  // ─────────────────────────────────────────────────────────────────────────
  async storeFcmToken(userId: number, fcmToken: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });
    if (!user) throw new NotFoundException('User not found');
    return { message: 'FCM token stored successfully' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ⑮ UNREAD COUNT (for bell badge)
  // ─────────────────────────────────────────────────────────────────────────
  async getUnreadCount(user: IUser): Promise<{ count: number }> {
    const now = new Date();

    const count = await this.prisma.notification.count({
      where: {
        is_active: true,
        AND: [
          { OR: [{ expiry_date: null }, { expiry_date: { gte: now } }] },
          {
            OR: [
              { target_role: null, target_user_ids: { isEmpty: true } },
              {
                target_role: (user.roles?.[0]?.name as NotificationSentRole) ?? null,
                target_user_ids: { isEmpty: true },
              },
              { target_user_ids: { has: user.id } },
            ],
          },
          {
            OR: [
              { userId: user.id, is_read: false },
              { userId: null, mark_as_read_id: { isEmpty: true } },
              // not in mark_as_read_id
              { userId: null, NOT: { mark_as_read_id: { has: user.id } } },
            ],
          },
        ],
      },
    });

    return { count };
  }
}