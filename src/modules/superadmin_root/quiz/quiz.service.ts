import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';


@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) { }

    async create(
      dto: CreateQuizDto,
      changedByRole :string,
      changedByAdminId?: number,
    ) {
      const record = await this.prisma.quiz.findFirst({
        where: {
          title: dto.title,
        },
      });

      if (record) throw new ConflictException('Quiz already exist');

      const res = await this.prisma.quiz.create({
        data: {
          ...dto,
          created_by_id: changedByAdminId,
        },
      });

      await this.prisma.quizLog.create({
        data: {
          quizId: res.id,
          title: res.title,
          quizOption: res.QuizOption!,
          description: res.description,
          category: res.category,
          isActive: res.is_active,
          changedByRole,
          changedByAdminId,
        },
      });

      return res;
    }


  //  
  async findAll() {
    return this.prisma.quiz.findMany();
  }

  //  
  async findActiveQuiz() {
    return this.prisma.quiz.findFirst({
      where: {
        is_active: true
      }
    });
  }


  // 
  async findOne(id: number) {
    return this.prisma.quiz.findUnique({
      where: { id },
    });
  }


  // 
    async update(
      id: number,
      dto: UpdateQuizDto,
      changedByRole :string,
      changedByAdminId?: number,
    ) {
      const record = await this.prisma.quiz.findUnique({
        where: { id },
      });

      if (!record) throw new ConflictException('Quiz not found');

      const updated = await this.prisma.quiz.update({
        where: { id },
        data: dto,
      });

      await this.prisma.quizLog.create({
        data: {
          quizId: updated.id,
          title: updated.title,
          quizOption: updated.QuizOption!,
          description: updated.description,
          category: updated.category,
          isActive: updated.is_active,
          changedByRole,
          changedByAdminId,
        },
      });

      return updated;
    }



  // 
  async remove(id: number) {
    //  
    const record = await this.prisma.quiz.findFirst({
      where: {
        id
      }
    })

    //  
    if (!record) throw new ConflictException("Quiz Not found")

    return this.prisma.quiz.delete({
      where: { id },
    });
   }
   
  //  
  async findAllLogs(fromDate?: string, toDate?: string) {
      return await this.prisma.quizLog.findMany({
        where: {
          createdAt: {
            gte: fromDate ? new Date(fromDate) : undefined,
            lte: toDate ? new Date(toDate) : undefined,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }



}
