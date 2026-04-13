import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { DateByFilterDto } from '../customer_order_confirmation/dto/date-filter.dto';


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
  async remove(id: number,  changedByRole :string,
      changedByAdminId?: number,) {
    //  
    const record = await this.prisma.quiz.findFirst({
      where: {
        id
      }
    })

    //  
    if (!record) throw new ConflictException("Quiz Not found")
    
      await this.prisma.quizLog.create({
        data: {
          quizId: record.id,
          title: record.title,
          quizOption: record.QuizOption!,
          description: record.description,
          category: record.category,
          isActive: record.is_active,
          changedByRole,
          changedByAdminId,
        },
      });
    return this.prisma.quiz.delete({
      where: { id },
    });
   }
   
  //  
 async findAllLogs(filterDto: DateByFilterDto) {
  const {
    fromDate,
    toDate,
    page = 1,
    limit = 10,
    search,
  } = filterDto;

  const skip = (page - 1) * limit;

  const where: any = {
    createdAt: {
      gte: fromDate ? new Date(fromDate) : undefined,
      lte: toDate ? new Date(toDate) : undefined,
    },
  };

  // Optional search (adjust fields based on your schema)
  if (search) {
    where.OR = [
      {
        action: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  const [data, total] = await this.prisma.$transaction([
    this.prisma.quizLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    this.prisma.quizLog.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}




}
