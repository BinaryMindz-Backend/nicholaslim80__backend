/* eslint-disable no-case-declarations */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { NotificationType, UserRole, NotificationSentRole, Prisma } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { FirebaseService } from './firebase.service';
import { MailService } from 'src/common/services/mail.service';
import { SmsService } from 'src/common/services/sms.service';
import { AdminCreateNotificationDto } from './dto/create-notification.dto';
import { FindNotificationsDto } from './dto/find-notifications.dto';
import { DeleteNotificationsDto } from './dto/delete-notifications.dto';
import { IUser } from 'src/types';

@Injectable()
export class NotificationService {

  ADMIN_ALLOWED_TYPES: NotificationType[] = [
    NotificationType.PUSH_NOTIFICATION,
    NotificationType.EMAIL,
    NotificationType.SMS,
    NotificationType.WEB_ANNOUNCEMENT,
  ];

  constructor(
    private prisma: PrismaService,
    private fcmService: FirebaseService,
    private mailService: MailService,
    private smsService: SmsService,
  ) { }

  async broadcast(dto: AdminCreateNotificationDto) {
    if (!this.ADMIN_ALLOWED_TYPES.includes(dto.type)) {
      throw new BadRequestException('Invalid notification type for admin');
    }

    // FIXED ROLE FILTER
    // const whereRole: any = {};
    // if (dto.target_role === NotificationSentRole.USER) whereRole.roles = { name: UserRole.USER };
    // if (dto.target_role === NotificationSentRole.RAIDER) whereRole.roles = { name: UserRole.RAIDER };
    const roleMap = {
      [NotificationSentRole.USER]: UserRole.USER,
      [NotificationSentRole.RAIDER]: UserRole.RAIDER,
    };

    const whereRole: Prisma.UserWhereInput =
      roleMap[dto.target_role!]
        ? {
          roles: {
            some: { name: roleMap[dto.target_role!] },
          },
        }
        : {};

    //  console.log(whereRole);
    const users = await this.prisma.user.findMany({
      where: whereRole,
      select: { email: true, phone: true, fcmToken: true },
    });

    if (users.length === 0) {
      throw new BadRequestException('No users found for the specified role');
    }

    const notification = await this.prisma.notification.create({
      data: {
        type: dto.type,
        title: dto.title,
        message: dto.message,
        send_immediately: dto.send_immediately,
        schedule_to_send: dto.schedule_to_send ? new Date(dto.schedule_to_send) : null,
        target_role: dto.target_role,
        is_from_admin: true,
      },
    });

    const mappedUsers = users.map(u => ({
      email: u.email ?? undefined,
      phone: u.phone ?? undefined,
      fcmToken: u.fcmToken ?? undefined,
    }));

    if (dto.send_immediately) {
      await this.sendNotificationByType(dto.type, mappedUsers, dto.title, dto.message);
    }

    // Only return simple JSON
    return {
      notificationId: notification.id,
      usersCount: mappedUsers.length,
      type: dto.type,
      sendImmediately: dto.send_immediately,
    };
  }

  public async sendNotificationByType(
    type: NotificationType,
    users: { email?: string; phone?: string; fcmToken?: string }[],
    title?: string,
    message?: string,
  ) {
    switch (type) {

      // 
      case NotificationType.PUSH_NOTIFICATION:
        const pushUsers = users.filter(u => !!u.fcmToken);
        // console.log("Users with fcmToken:", pushUsers);

        await Promise.all(
          pushUsers.map(u =>
            this.fcmService.sendPush({
              token: u.fcmToken!,
              title,
              body: message ?? "",
            }),
            // 

          ),
        );
        // console.log("Push sent for type:", type, pushUsers);
        break;


      // case for email type
      case NotificationType.EMAIL:
        const emailUsers = users.filter(u => !!u.email);
        // console.log("Sending email to:", emailUsers.map(u => u.email));

        await Promise.all(
          emailUsers.map(u =>
            this.mailService.sendTemplateMail(
              'plain-text', // the HBS template we just created
              u.email!,
              title!,
              { text: message! } // pass your plain text as `text`
            )
          ),
        );
        break;

      //  
      case NotificationType.SMS:
        // console.log("SMS reached:", users);
        await Promise.all(
          users
            .filter(u => !!u.phone)
            .map(u => this.smsService.send({
              to: u.phone!,
              message: message!
            }))
        );
        break;
      // 
      case NotificationType.WEB_ANNOUNCEMENT:
        // For web announcements, we might just log or store them
        await this.prisma.notification.create({
          data: {
            type,
            title,
            message,
            is_from_admin: true,
          },
        });

        break;

    }
  }



  // finally working
  async findAll(dto: FindNotificationsDto, user: IUser) {
    const { page = '1', limit = '10', type, isRead } = dto;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {
      OR: [
        { target_role: null },
        { target_role: user.roles[0].name }
      ]
    };

    if (type) where.type = type;
    if (isRead !== undefined) where.is_read = isRead === 'true';
    if (user.roles[0].id) where.userId = user.id;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }





  // 
  async findOne(id: number) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  // 
  async markAsRead(id: number, user: IUser) {
    const notification = await this.prisma.notification.update({
      where: { id },
      data: { is_read: true, mark_as_read_id: [user?.id] },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  async delete(id: number) {
    const notification = await this.prisma.notification.delete({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    return { message: 'Notification deleted successfully' };
  }

  // 
  async deleteMany(dto: DeleteNotificationsDto) {
    const { ids } = dto;
    await this.prisma.notification.deleteMany({ where: { id: { in: ids } } });
    return { message: `${ids.length} notifications deleted successfully` };
  }
  // store fcm token to db
  async storeFcmToken(userId: number, fcmToken: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });
    if (!user) throw new NotFoundException('User not found');
    return { message: 'FCM token stored successfully' };
  }
}

