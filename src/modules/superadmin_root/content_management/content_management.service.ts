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


  async remove(id: number,changedByRole:string,changedByUserId:number ) {
      const exitContent = await this.prisma.contentManagement.findFirst({
        where:{id}
      })
      if (!exitContent) {
       throw new NotFoundException(`You have not content at the content Number: (${id})`)
      }
   const res = await this.prisma.contentManagement.delete({
        where:{
          id
        }
      })
      // 
      await this.prisma.contentManagementLog.create({
          data: {
            contentId: exitContent.id,
            contentType: exitContent.contenttype,
            faqFor: exitContent.faq_for,
            description: exitContent.description,
            isPublished: exitContent.isPublished,
            version: exitContent.version,
            changedByRole,
            changedByUserId,
          },
        });
      return res
  }
  //  
  async findAllLogs(fromDate?: string, toDate?: string) {
    return await this.prisma.contentManagementLog.findMany({
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
