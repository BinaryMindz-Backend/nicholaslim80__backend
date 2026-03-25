/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateContentManagementDto } from './dto/create-content_management.dto';
import { UpdateContentManagementDto } from './dto/update-content_management.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { ApiResponses } from 'src/common/apiResponse'; 
 

@Injectable()
export class ContentManagementService {
  constructor(
    private readonly prisma: PrismaService
  ){}
    // 
    async create(
      createContentManagementDto: CreateContentManagementDto,
      changedByRole :string,
      changedByUserId?: number,
    ) {
      const existContentType = await this.prisma.contentManagement.findFirst({
        where: {
          contenttype: createContentManagementDto.contenttype,
          faq_for:createContentManagementDto.faq_for,
        },
      });

      if (existContentType) {
        return ApiResponses.error(
          `You have already created this (${existContentType.contenttype}) type`,
        );
      }

      const data = await this.prisma.contentManagement.create({
        data: {
          ...createContentManagementDto,
        },
      });

      await this.prisma.contentManagementLog.create({
        data: {
          contentId: data.id,
          contentType: data.contenttype,
          faqFor: data.faq_for,
          description: data.description,
          isPublished: data.isPublished,
          version: data.version,
          changedByRole,
          changedByUserId,
        },
      });

      return data;
    }


  async findAll() {
   try {
    return await this.prisma.contentManagement.findMany()
   } catch (error) {
      return error
   }
  }

 async findOne(id: number) {
     try {
      const exitContent = await this.prisma.contentManagement.findFirst({
        where:{id}
      })
      if (! exitContent) {
        return ApiResponses.error(`You have not content at the content Number: (${id})`)
      }
    return await this.prisma.contentManagement.findFirst({
      where:{id}
    })
   } catch (error) {
      return error
   }
  }

    async update(
      id: number,
      updateContentManagementDto: UpdateContentManagementDto,
      changedByRole :string,
      changedByUserId: number,
    ) {
      try {
        const existContent = await this.prisma.contentManagement.findUnique({
          where: { id },
        });

        if (!existContent) {
          return ApiResponses.error(
            `You have no content at the content Number: (${id})`,
          );
        }

        const res = await this.prisma.contentManagement.update({
          where: { id },
          data: {
            ...updateContentManagementDto,
          },
        });

        await this.prisma.contentManagementLog.create({
          data: {
            contentId: res.id,
            contentType: res.contenttype,
            faqFor: res.faq_for,
            description: res.description,
            isPublished: res.isPublished,
            version: res.version,
            changedByRole,
            changedByUserId,
          },
        });

        return res;
      } catch (error) {
        return error;
      }
    }


 async remove(
  id: number,
  changedByRole: string,
  changedByUserId: number,
) {
  return this.prisma.$transaction(async (tx) => {

    const existing = await tx.contentManagement.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(
        `Content not found (${id})`,
      );
    }

    await tx.contentManagementLog.create({
      data: {
        contentId: existing.id,
        contentType: existing.contenttype,
        faqFor: existing.faq_for,
        description: existing.description,
        isPublished: existing.isPublished,
        version: existing.version,
        changedByRole,
        changedByUserId,
      },
    });

    return tx.contentManagement.delete({
      where: { id },
    });
  });
}

  //  
  async findAllLogs(
  fromDate?: string,
  toDate?: string,
  search?: string,
  page = 1,
  limit = 10,
) {
  const skip = (page - 1) * limit;

  const where: any = {
    createdAt: {
      gte: fromDate ? new Date(fromDate) : undefined,
      lte: toDate ? new Date(toDate) : undefined,
    },
  };

  // Add search condition (adjust fields based on your schema)
  if (search) {
    where.OR = [
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      }
    ];
  }

  const [data, total] = await this.prisma.$transaction([
    this.prisma.contentManagementLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    this.prisma.contentManagementLog.count({ where }),
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
