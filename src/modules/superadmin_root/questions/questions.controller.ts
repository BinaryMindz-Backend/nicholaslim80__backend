import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
  } from '@nestjs/common';
  import { QuestionsService } from './questions.service';
  import { CreateQuestionDto } from './dto/create-question.dto';
  import { UpdateQuestionDto } from './dto/update-question.dto';
  import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
  
  @ApiTags('questions')
  @Controller('questions')
  export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) {}
  
    @Post()
    @ApiOperation({ summary: 'Create a new question' })
    @ApiResponse({ status: 201, description: 'Question created' })
    create(@Body() dto: CreateQuestionDto) {
      return this.questionsService.create(dto);
    }
  
    @Get()
    @ApiOperation({ summary: 'Get all questions' })
    findAll() {
      return this.questionsService.findAll();
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get a single question by ID' })
    findOne(@Param('id') id: string) {
      return this.questionsService.findOne(+id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update a question and its options' })
    update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
      return this.questionsService.update(+id, dto);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a question by ID' })
    remove(@Param('id') id: string) {
      return this.questionsService.remove(+id);
    }
  }
  