/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) { }

  @Post()
  @Auth()
  @RequirePermission(Module.CONTENT_MANAGEMENT, Permission.CREATE)
  @ApiBearerAuth()
  async create(@Body() createArticleDto: CreateArticleDto) {
    try {
      return await this.articleService.create(createArticleDto);
    } catch (error) {
      return error;
    }
  }

  @Get()
  @Auth()
  @RequirePermission(Module.CONTENT_MANAGEMENT, Permission.READ)
  @ApiBearerAuth()
  async findAll() {
    try {
      return await this.articleService.findAll();
    } catch (error) {
      return error;
    }
  }

  @Patch('change-status/:id')
  @Auth()
  @RequirePermission(Module.CONTENT_MANAGEMENT, Permission.UPDATE)
  @ApiBearerAuth()
  async changeStatus(@Param('id') id: string) {
    try { return await this.articleService.changeStatus(+id); } catch (error) {
      return error;
    }

  }

  @Patch(':id')
  @Auth()
  @RequirePermission(Module.CONTENT_MANAGEMENT, Permission.UPDATE)
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    return await this.articleService.update(+id, updateArticleDto);
  }

  @Delete(':id')
  @Auth()
  @RequirePermission(Module.CONTENT_MANAGEMENT, Permission.DELETE)
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    return await this.articleService.remove(+id);
  }
}
