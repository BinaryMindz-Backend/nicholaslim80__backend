import { Injectable } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

 async create(dto: CreateQuestionDto) {
    return await this.prisma.question.create({
      data: {
        quizId: dto.quizId,
        quesType: dto.quesType,
        quesCategory: dto.quesCategory,
        quesDeficulty: dto.quesDeficulty,
        question_text: dto.question_text,

        options: dto.options
          ? {
              create: dto.options.map((o) => ({
                option_text: o.option_text,
                is_correct: o.is_correct,
              })),
            }
          : undefined,
      },
      include: { options: true },
    });
  }

 async findAll() {
    return await this.prisma.question.findMany({
      include: { options: true },
    });
  }

  async findOne(id: number) {
    return await this.prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });
  }

 async update(id: number, dto: UpdateQuestionDto) {
    return await this.prisma.question.update({
      where: { id },
      data: {
        ...dto,
        options: dto.options
          ? {
              deleteMany: { questionId: id }, 
              create: dto.options,
            }
          : undefined,
      },
      include: { options: true },
    });
  }

 async remove(id: number) {
    return await this.prisma.question.delete({
      where: { id },
    });
  }
}
