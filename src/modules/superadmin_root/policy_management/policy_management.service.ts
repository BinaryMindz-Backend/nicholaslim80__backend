/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreatePolicyDto } from './dto/create-policy_management.dto';
import { UpdatePolicyDto } from './dto/update-policy_management.dto';
import { ActivityLogService } from '../additional_services/activity_logs.services';

@Injectable()
export class PolicyService {
  constructor(
    private prisma: PrismaService,
    private activityLogService: ActivityLogService,
  ) { }

  // ---------------- CREATE ----------------
  async create(dto: CreatePolicyDto, userId: number) {
    const r = await this.prisma.policy.findFirst({
      where: { title: dto.title },
    });

    if (r) {
      throw new ConflictException('Policy with the same title already exists');
    }

    const res = await this.prisma.policy.create({ data: dto });

    // LOG
    await this.activityLogService.log({
      action: 'CREATE',
      entityType: 'Policy',
      entityId: res.id,
      userId,
      meta: {
        data: res,
      },
    });

    return res;
  }

  // ---------------- FIND ALL ----------------
  async findAll() {
    return this.prisma.policy.findMany({
      orderBy: { created_at: 'asc' },
    });
  }

  // ---------------- FIND ONE ----------------
  async findOne(id: number) {
    return this.prisma.policy.findUnique({ where: { id } });
  }

  // ---------------- UPDATE ----------------
  async update(id: number, dto: UpdatePolicyDto, userId: number) {
    const existing = await this.prisma.policy.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Policy not found');
    }

    if (dto.title) {
      const duplicate = await this.prisma.policy.findFirst({
        where: {
          title: dto.title,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new BadRequestException('Title already exists for another policy');
      }
    }

    const updated = await this.prisma.policy.update({
      where: { id },
      data: dto,
    });

    // LOG
    await this.activityLogService.log({
      action: 'UPDATE',
      entityType: 'Policy',
      entityId: id,
      userId,
      meta: {
        before: existing,
        after: updated,
      },
    });

    return updated;
  }

  // ---------------- UPDATE STATUS ----------------
  async updateStatus(id: number, userId: number) {
    const existing = await this.prisma.policy.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Your selected policy not found');
    }

    const updated = await this.prisma.policy.update({
      where: { id },
      data: {
        isPublist: !existing.isPublist,
      },
    });

    // LOG
    await this.activityLogService.log({
      action: 'UPDATE',
      entityType: 'Policy',
      entityId: id,
      userId,
      meta: {
        before: existing,
        after: updated,
        change: 'status_toggle',
      },
    });

    return updated;
  }

  // ---------------- DELETE ----------------
  async remove(id: number, userId: number) {
    const existing = await this.prisma.policy.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Record not found');
    }

    await this.prisma.policy.delete({ where: { id } });

    // LOG
    await this.activityLogService.log({
      action: 'DELETE',
      entityType: 'Policy',
      entityId: id,
      userId,
      meta: {
        deletedData: existing,
      },
    });

    return { message: 'Policy deleted successfully' };
  }
}