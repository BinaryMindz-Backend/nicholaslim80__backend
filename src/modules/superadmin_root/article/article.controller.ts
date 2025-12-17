/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) { }

  @Post()
  async create(@Body() createArticleDto: CreateArticleDto) {
    try {
      return await this.articleService.create(createArticleDto);
    } catch (error) {
      return error;
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.articleService.findAll();
    } catch (error) {
      return error;
    }
  }

  @Patch('change-status/:id')
  async changeStatus(@Param('id') id: string) {
    try { return await this.articleService.changeStatus(+id); } catch (error) {
      return error;
    }

  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    return await this.articleService.update(+id, updateArticleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.articleService.remove(+id);
  }
}
