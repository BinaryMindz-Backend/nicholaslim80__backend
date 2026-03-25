import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateDashboardPopupDto } from './dto/create-dashboard_popup.dto';
import { UpdateDashboardPopupDto } from './dto/update-dashboard_popup.dto';

@Injectable()
export class DashboardPopupService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDashboardPopupDto, userId: number) {
    const popup = await this.prisma.dashboardPopup.create({
      data: dto,
    });

    // LOG
    await this.prisma.activityLog.create({
      data: {
        action: 'CREATE',
        entity_type: 'DashboardPopup',
        entity_id: popup.id,
        user_id: userId,
        meta: popup,
      },
    });

    return popup;
  }

  async findAll() {
    return await this.prisma.dashboardPopup.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const popup = await this.prisma.dashboardPopup.findUnique({ where: { id } });
    if (!popup) throw new NotFoundException('Dashboard popup not found');
    return popup;
  }

  async update(id: number, dto: UpdateDashboardPopupDto, userId: number) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.dashboardPopup.update({
      where: { id },
      data: dto,
    });

    // LOG (before & after)
    await this.prisma.activityLog.create({
      data: {
        action: 'UPDATE',
        entity_type: 'DashboardPopup',
        entity_id: id,
        user_id: userId,
        meta: {
          before: existing,
          after: updated,
        },
      },
    });

    return updated;
  }

  async remove(id: number, userId: number) {
    const existing = await this.findOne(id);

    const deleted = await this.prisma.dashboardPopup.delete({
      where: { id },
    });

    // LOG
    await this.prisma.activityLog.create({
      data: {
        action: 'DELETE',
        entity_type: 'DashboardPopup',
        entity_id: id,
        user_id: userId,
        meta: existing,
      },
    });

    return deleted;
  }
}