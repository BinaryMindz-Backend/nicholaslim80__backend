import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';


@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateQuizDto) {

    const record = await this.prisma.quiz.findFirst({
      where: {
        title: dto.title
      }
    })
    //  
    if (record) throw new ConflictException("Quiz already exist")

    const res = await this.prisma.quiz.create({
      data: dto,
    });
    return res
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
  async update(id: number, dto: UpdateQuizDto) {
    const record = await this.prisma.quiz.findFirst({
      where: {
        id
      }
    })

    //  
    if (!record) throw new ConflictException("Quiz Not found")
    // 
    return this.prisma.quiz.update({
      where: { id },
      data: dto,
    });
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
}
