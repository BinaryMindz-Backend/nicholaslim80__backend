import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuizResultdto } from './dto/raider-quiz-result.dto';
import { IUser } from 'src/types';
import { RaiderQuizFilterDto } from './dto/raiderQuizFilterDto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  // CREATE QUESTION
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

  // GET ALL QUESTIONS
  async findAll() {
    return await this.prisma.question.findMany({
      include: { options: true },
    });
  }

  // GET ONE QUESTION BY ID
  async findOne(id: number) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });

    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  // UPDATE QUESTION
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

  // DELETE QUESTION
  async remove(id: number) {
    // Check if question exists
    const existing = await this.prisma.question.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Question not found');

    return await this.prisma.question.delete({
      where: { id },
    });
  }
  



// raider result
async raiderResult(id: number, dto: QuizResultdto, raider: IUser) {
  if (!raider) {
    throw new NotFoundException('Raider not found');
  }

  if (!id) {
    throw new NotFoundException('Quiz ID is required');
  }

  // Validate quiz
  const quizRecord = await this.prisma.quiz.findUnique({ where: { id } });
  if (!quizRecord) throw new NotFoundException('Quiz not found by this ID');

  // Validate raider record
  const record = await this.prisma.raider.findUnique({
    where: { userId: raider.id },
  });
  if (!record) throw new NotFoundException('Raider record not found');

  // Check if raider already has a quiz record for this quiz
  const raiderQuiz = await this.prisma.raiderQuiz.findFirst({
    where: {
      raiderId: record.id,
      quizId: id,
    },
  });
  
  // If no record exists → create it
  if (raiderQuiz == null) {
    const created = await this.prisma.raiderQuiz.create({
      data: {
        quizId: id,
        raiderId: record.id,
        ...dto,
      },
    });

    return created;
  }else{
       // If record exists → update attempts + new data
  const updated = await this.prisma.raiderQuiz.update({
    where: { id: raiderQuiz.id },
    data: {
      attempt_count: raiderQuiz.attempt_count + 1,
      ...dto, 
    },
  });

  return updated;
  }


}


// get all raider result
async getAllRaiderResults(user: IUser, query: RaiderQuizFilterDto) {
  if (!user) throw new NotFoundException('User not found');
  const {
    minScore,
    maxScore,
    minCorrect,
    minAttempts,
    fromDate,
    toDate,
    page = 1,
    limit = 20,
    sortBy = 'completed_at',
    sortOrder = 'desc',
  } = query;

  const skip = (page - 1) * limit;

  // Build dynamic filters
  const where: any = {};

  if (minScore) where.score = { gte: Number(minScore) };
  if (maxScore) where.score = { ...(where.score || {}), lte: Number(maxScore) };

  if (minCorrect) where.correct_answers = { gte: Number(minCorrect) };
  if (minAttempts) where.attempt_count = { gte: Number(minAttempts) };

  if (fromDate)
    where.completed_at = { gte: new Date(fromDate) };

  if (toDate)
    where.completed_at = { ...(where.completed_at || {}), lte: new Date(toDate) };

  // Fetch quiz results
  const results = await this.prisma.raiderQuiz.findMany({
    where,
    include: {
      raider: true,
      quiz: true,
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  if (!results.length) {
    throw new NotFoundException('No quiz results found');
  }

  return {
    page,
    limit,
    total: results.length,
    data: results,
  };
}



// 
async getIndivitualraiderResult(raiderId:number) {
  if (!raiderId) throw new NotFoundException('raider id not found');

  // fetch quiz results
  const results = await this.prisma.raiderQuiz.findFirst({
          where:{
               raiderId
          },
          include:{
             raider:true
          }
  });

  if (!results) {
    throw new NotFoundException('No quiz results found');
  }

  return results;
}

// delete quiz ans 
async deleteIndivitualraiderResult(id:number) {
  if (!id) throw new NotFoundException('raider id not found');

  // fetch quiz results
  const record = await this.prisma.raiderQuiz.findFirst({
          where:{
               id
          }
  });

  if (!record) {
    throw new NotFoundException('No quiz results found');
  }

  // 
 await this.prisma.raiderQuiz.delete({
       where:{
          id:record.id,
       }
  })

  return null;
}




}
