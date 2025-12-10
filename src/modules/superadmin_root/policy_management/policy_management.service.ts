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

@Injectable()
export class PolicyService {
  constructor(private prisma: PrismaService) {}

  // CREATE
  async create(dto: CreatePolicyDto) {
    //
    const r = await this.prisma.policy.findFirst({
      where: {
        title: dto.title,
      },
    });
    //
    if (r?.title) {
      throw new ConflictException('Policy with the same title already have');
    }
    //
    const res = await this.prisma.policy.create({ data: dto });
    return res;
  }

  // FIND ALL
  async findAll() {
    //
    const res = await this.prisma.policy.findMany({
      orderBy: { created_at: 'asc' },
    });
    return res;
    //
  }

  // FIND ONE
  async findOne(id: number) {
    return await this.prisma.policy.findUnique({ where: { id } });
  }

  // UPDATE
  async update(id: number, dto: UpdatePolicyDto) {
    // 1) Find existing policy
    const existing = await this.prisma.policy.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Policy not found');
    }

    // 2) Check if another policy already uses this title
    if (dto.title) {
      const duplicate = await this.prisma.policy.findFirst({
        where: {
          title: dto.title,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          'Title already exists for another policy',
        );
      }
    }

    // 3) Update safely
    return await this.prisma.policy.update({
      where: { id },
      data: dto,
    });
  }

  // Update status
  async updateStatus(id: number) {
    const exitPolicy = await this.prisma.policy.findFirst({
      where: {
        id,
      },
    });

    if (!exitPolicy) {
      throw new NotFoundException('Your selected policy not found');
    }
    const updateStatus = await this.prisma.policy.update({
      where: { id },
      data: {
        isPublist: !exitPolicy.isPublist,
      },
    });
    return updateStatus;
  }

  // DELETE
  async remove(id: number) {
    //
    const r = await this.prisma.policy.findUnique({
      where: {
        id,
      },
    });

    if (!r) throw new NotFoundException('Record not found');

    return await this.prisma.policy.delete({ where: { id } });
  }
}
