import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';
import { UserRole } from '@prisma/client';

@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) { }

  @Post()
  @Auth()
  @RequirePermission(Module.FAQ, Permission.CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new faq' })
  async create(@Body() createFaqDto: CreateFaqDto) {
    return await this.faqService.create(createFaqDto);
  }

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all faqs' })
  @RequirePermission(Module.FAQ, Permission.READ)
  async findAll() {
    return await this.faqService.findAll();
  }
  // 
  @Get("faqs-by-role")
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all FAQs' })
  @RequirePermission(Module.FAQ, Permission.READ)
  async findByRole(@CurrentUser() user: IUser) {
    return await this.faqService.findByRole(user);
  }




  @Patch('change-status/:id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change faq status' })
  @RequirePermission(Module.FAQ, Permission.UPDATE)
  async findOne(@Param('id') id: string) {
    return await this.faqService.findOne(+id);
  }

  @Patch(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update faq' })
  @RequirePermission(Module.FAQ, Permission.UPDATE)
  async update(@Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto) {
    return await this.faqService.update(+id, updateFaqDto);
  }

  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete faq' })
  @RequirePermission(Module.FAQ, Permission.DELETE)
  async remove(@Param('id') id: string) {
    return await this.faqService.remove(+id);
  }
  // 

}
