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

import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from 'src/decorators/auth.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from '@prisma/client/edge';
import { ApiResponses } from 'src/common/apiResponse';

@ApiTags('questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  // -----------------------------
  // CREATE QUESTION
  // -----------------------------
  @Post()
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new question' })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() dto: CreateQuestionDto) {
    try {
      const res = await this.questionsService.create(dto);
      return ApiResponses.success(res, 'Question created successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to create question');
    }
  }

  // -----------------------------
  // GET ALL QUESTIONS
  // -----------------------------
  @Get()
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all questions' })
  @ApiResponse({ status: 200, description: 'Return all questions' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll() {
    try {
      const res = await this.questionsService.findAll();
      return ApiResponses.success(res, 'Questions fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch questions');
    }
  }

  // -----------------------------
  // GET ONE QUESTION BY ID
  // -----------------------------
  @Get(':id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.RAIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single question by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Return the question' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findOne(@Param('id') id: string) {
    try {
      const res = await this.questionsService.findOne(+id);

      if (!res) {
        return ApiResponses.error(null, 'Question not found');
      }

      return ApiResponses.success(res, 'Question fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch question');
    }
  }

  // -----------------------------
  // UPDATE QUESTION
  // -----------------------------
  @Patch(':id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a question' })
  @ApiResponse({ status: 200, description: 'Question updated' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    try {
      const res = await this.questionsService.update(+id, dto);
      return ApiResponses.success(res, 'Question updated successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to update question');
    }
  }

  // -----------------------------
  // DELETE QUESTION
  // -----------------------------
  @Delete(':id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a question by ID' })
  @ApiResponse({ status: 200, description: 'Question deleted' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async remove(@Param('id') id: string) {
    try {
      const res = await this.questionsService.remove(+id);
      return ApiResponses.success(res, 'Question deleted successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to delete question');
    }
  }
}
