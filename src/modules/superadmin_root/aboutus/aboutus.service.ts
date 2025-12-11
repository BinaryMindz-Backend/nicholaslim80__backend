/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { CreateAboutusDto } from './dto/create-aboutus.dto';
import { UpdateAboutusDto } from './dto/update-aboutus.dto';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class AboutusService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }
  async create(createAboutusDto: CreateAboutusDto) {
    try {
      const data = await this.prisma.aboutUs.create({
        data: createAboutusDto,
      });
      return data;
    } catch (error) {
      return error;
    }
  }

  async findAll() {
    return await this.prisma.aboutUs.findMany();
  }

  async changeStatus(id: number) {
    try {
      const dataExit = await this.prisma.aboutUs.findUnique({ where: { id } });
      if (!dataExit) {
        throw new Error('About Us not found');
      }
      await this.prisma.aboutUs.update({
        where: { id },
        data: { isActive: !dataExit.isActive },
      });
    } catch (error) {
      return error;
    }
  }

  async update(id: number, updateAboutusDto: UpdateAboutusDto) {
    try {
      const dataExit = await this.prisma.aboutUs.findUnique({ where: { id } });
      if (!dataExit) {
        throw new Error('About Us not found');
      }
      return await this.prisma.aboutUs.update({
        where: { id },
        data: updateAboutusDto,
      });
    } catch (error) {
      return error;
    }
  }

  async remove(id: number) {
    try {
      const dataExit = await this.prisma.aboutUs.findUnique({ where: { id } });
      if (!dataExit) {
        throw new Error('About Us not found');
      }
      return await this.prisma.aboutUs.delete({
        where: { id },
      });
    } catch (error) {
      return error;
    }
  }
}
