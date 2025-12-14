import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) { }

  @Post()
  async create(@Body() createFaqDto: CreateFaqDto) {
    return await this.faqService.create(createFaqDto);
  }

  @Get()
  async findAll() {
    return await this.faqService.findAll();
  }

  @Patch('change-status/:id')
  async findOne(@Param('id') id: string) {
    return await this.faqService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto) {
    return await this.faqService.update(+id, updateFaqDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.faqService.remove(+id);
  }
}
