/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { CreateContentManagementDto } from './dto/create-content_management.dto';
import { UpdateContentManagementDto } from './dto/update-content_management.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { ApiResponses } from 'src/common/apiResponse'; 
 

@Injectable()
export class ContentManagementService {
  constructor(
    private readonly prisma: PrismaService
  ){}
 async create(createContentManagementDto: CreateContentManagementDto) {
  const exitContenttype = await this.prisma.contentManagement.findFirst({
    where:{
      contenttype:createContentManagementDto.contenttype
    }
  })
  console.log(exitContenttype);
  if (exitContenttype) {
    return  ApiResponses.error(`You have already create this (${exitContenttype.contenttype}) type `)
  }
   const data =    await this.prisma.contentManagement.create({
        data:{
          ... createContentManagementDto
        }
      })
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

  async update(id: number, updateContentManagementDto: UpdateContentManagementDto) {
     try {
      const exitContent = await this.prisma.contentManagement.findFirst({
        where:{id}
      })
      if (! exitContent) {
        return ApiResponses.error(`You have not content at the content Number: (${id})`)
      }
    
    const res =  await this.prisma.contentManagement.update({
      where:{id},
        data:{
          ...updateContentManagementDto
        }
      
    })
    return res;
   } catch (error) {
      return error
   }
  }

  async remove(id: number) {
     try {
      const exitContent = await this.prisma.contentManagement.findFirst({
        where:{id}
      })
      if (! exitContent) {
        return ApiResponses.error(`You have not content at the content Number: (${id})`)
      }
   const res =    await this.prisma.contentManagement.delete({
        where:{
          id
        }
      })
      return res
     } catch (error) {
      return error
     }
  }
}
