/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateDashboardPopupDto } from './dto/create-dashboard_popup.dto';
import { UpdateDashboardPopupDto } from './dto/update-dashboard_popup.dto';
;

@Injectable()
export class DashboardPopupService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDashboardPopupDto) {
    return await this.prisma.dashboardPopup.create({ data: dto });
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

  async update(id: number, dto: UpdateDashboardPopupDto) {
    await this.findOne(id);
    return this.prisma.dashboardPopup.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.dashboardPopup.delete({ where: { id } });
  }
}
