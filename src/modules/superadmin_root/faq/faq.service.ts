import { Injectable } from '@nestjs/common';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { ApiResponses } from 'src/common/apiResponse';
import { UserRole } from '@prisma/client';
import { IUser } from 'src/types';

@Injectable()
export class FaqService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }
  async create(createFaqDto: CreateFaqDto) {
    try {
      const data = await this.prisma.fAQ.create({
        data: {
          question: createFaqDto.question,
          answer: createFaqDto.answer,
          faq_for: createFaqDto.faq_for,
        },
      });
      return ApiResponses.success(data, 'FAQ created successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to create FAQ');
    }
  }

  async findAll() {
    const data = await this.prisma.fAQ.findMany();
    return ApiResponses.success(data, 'FAQs retrieved successfully');
  }

  //  
  async findByRole(filters: IUser) {
    return await this.prisma.fAQ.findMany({
      where: {
        isActive: true,
        OR: [
          { faq_for: filters.role.name as UserRole },
          { faq_for: UserRole.USER }, // USER sees common FAQs
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }






  async findOne(id: number) {
    const ids = await this.prisma.fAQ.findUnique({
      where: { id },
    });
    if (!ids) {
      return ApiResponses.error(null, `FAQ with id ${id} not found`);
    }

    const data = await this.prisma.fAQ.update({
      where: { id },
      data: { isActive: !ids.isActive },
    });
    return ApiResponses.success(data, `FAQ with id ${id} activated successfully`);
  }

  async update(id: number, updateFaqDto: UpdateFaqDto) {
    const data = await this.prisma.fAQ.update({
      where: { id },
      data: {
        question: updateFaqDto.question,
        answer: updateFaqDto.answer,
      },
    });
    return ApiResponses.success(data, `FAQ with id ${id} updated successfully`);
  }

  async remove(id: number) {
    const data = await this.prisma.fAQ.delete({
      where: { id },
    });
    return ApiResponses.success(data, `FAQ with id ${id} removed successfully`);
  }
}
