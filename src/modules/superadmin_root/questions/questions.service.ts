import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  // -----------------------------
  // CREATE QUESTION
  // -----------------------------
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

  // -----------------------------
  // GET ALL QUESTIONS
  // -----------------------------
  async findAll() {
    return await this.prisma.question.findMany({
      include: { options: true },
    });
  }

  // -----------------------------
  // GET ONE QUESTION BY ID
  // -----------------------------
  async findOne(id: number) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });

    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  // -----------------------------
  // UPDATE QUESTION
  // -----------------------------
  async update(id: number, dto: UpdateQuestionDto) {
    // Check if question exists
    const existing = await this.prisma.question.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Question not found');

    return await this.prisma.question.update({
      where: { id },
      data: {
        quizId: dto.quizId ?? existing.quizId,
        quesType: dto.quesType ?? existing.quesType,
        quesCategory: dto.quesCategory ?? existing.quesCategory,
        quesDeficulty: dto.quesDeficulty ?? existing.quesDeficulty,
        question_text: dto.question_text ?? existing.question_text,

        // Correct nested options update
        options: dto.options
          ? {
              deleteMany: {}, // delete all previous options
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

  // -----------------------------
  // DELETE QUESTION
  // -----------------------------
  async remove(id: number) {
    // Check if question exists
    const existing = await this.prisma.question.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Question not found');

    return await this.prisma.question.delete({
      where: { id },
    });
  }
}
