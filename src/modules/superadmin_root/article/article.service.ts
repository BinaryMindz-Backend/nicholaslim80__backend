import { Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { ApiResponses } from 'src/common/apiResponse';

@Injectable()
export class ArticleService {
  constructor(
    private readonly prisma: PrismaService
  ) { }
  async create(createArticleDto: CreateArticleDto) {
    try {
      const data = await this.prisma.article.create({
        data: createArticleDto
      });
      return ApiResponses.success(data, 'Article created successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  async findAll() {
    try {
      const data = await this.prisma.article.findMany();
      return ApiResponses.success(data, 'Articles fetched successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  async changeStatus(id: number) {
    try {
      const article = await this.prisma.article.findUnique({ where: { id } });
      if (!article) {
        return ApiResponses.error('Article not found');
      }
      const updatedArticle = await this.prisma.article.update({
        where: { id },
        data: { published: !article.published },
      });
      return ApiResponses.success(updatedArticle, 'Article status changed successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  async update(id: number, updateArticleDto: UpdateArticleDto) {
    try {
      const dataExists = await this.prisma.article.findUnique({ where: { id } });
      if (!dataExists) {
        return ApiResponses.error('Article not found');
      }
      const updatedData = await this.prisma.article.update({
        where: { id },
        data: updateArticleDto,
      });
      return ApiResponses.success(updatedData, 'Article updated successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  async remove(id: number) {
    try {
      const dataExists = await this.prisma.article.findUnique({ where: { id } });
      if (!dataExists) {
        return ApiResponses.error('Article not found');
      }
      await this.prisma.article.delete({ where: { id } });
      return ApiResponses.success(null, 'Article deleted successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }
}
