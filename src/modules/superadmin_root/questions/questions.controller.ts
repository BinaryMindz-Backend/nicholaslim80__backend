import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';

import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from 'src/decorators/auth.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from '@prisma/client/edge';
import { ApiResponses } from 'src/common/apiResponse';
import { QuizResultdto } from './dto/raider-quiz-result.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';
import { RaiderQuizFilterDto } from './dto/raiderQuizFilterDto';

@ApiTags('questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  // CREATE QUESTION
  @Post()
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new question (Admin Only)' })
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

  // GET ALL QUESTIONS
  @Get()
  @Auth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.RAIDER)
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

  // GET ONE QUESTION BY ID
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

  // UPDATE QUESTION
  @Patch(':id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a question (admin only)' })
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

  // DELETE QUESTION
  @Delete(':id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a question by ID (admin only)' })
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

  // Raider quiz result
  @Post(':quizId')
  @Auth()
  @Roles(UserRole.RAIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Post raider quiz result by ID (raider only)' })
  @ApiResponse({ status: 200, description: 'Question Result Saved' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async raiderResult(@Param('quizId') id: string, @Body() dto:QuizResultdto, @CurrentUser() user:IUser) {
    try {
      const res = await this.questionsService.raiderResult(+id, dto, user);
      return ApiResponses.success(res, 'Question Result added successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to post quiz result');
    }
  }
  
@Get('quiz/ans/all')
@Auth()
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get all quiz results (Admin only)' })
@ApiResponse({ status: 200, description: 'All results fetched successfully' })
@ApiResponse({ status: 404, description: 'No results found' })
async getAllRaiderResults(
  @CurrentUser() user: IUser,
  @Query() query: RaiderQuizFilterDto,
) {
  try {
    const res = await this.questionsService.getAllRaiderResults(user, query);
    return ApiResponses.success(res, 'All quiz results fetched successfully');
  } catch (error) {
    return ApiResponses.error(error, 'Failed to fetch quiz results');
  }
}

 
  
  //indivitual Raider quiz result
@Get('quiz/ans/:raiderId')
@Auth()
@Roles(UserRole.RAIDER, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get quiz results details for the logged-in raider(admin only)' })
@ApiResponse({ status: 200, description: ' results fetched successfully' })
@ApiResponse({ status: 404, description: 'No results found' })
async deleteIndivitualraiderResults(@Param("raiderId") id:string) {
  try {
    const res = await this.questionsService.getIndivitualraiderResult(+id);
    return ApiResponses.success(res, 'quiz results details fetched successfully');
  } catch (error) {
    return ApiResponses.error(error, 'Failed to fetch quiz results');
  }
}

// Raider quiz result
@Delete('quiz/ans/:id')
@Auth()
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth()
@ApiOperation({ summary: 'Delete quiz results details for the logged-in raider(admin only)' })
@ApiResponse({ status: 200, description: 'deleted successfully successfully' })
@ApiResponse({ status: 404, description: 'No results found' })
async getIndivitualraiderResults(@Param("id") id:string) {
  try {
    const res = await this.questionsService.deleteIndivitualraiderResult(+id);
    return ApiResponses.success(res, 'quiz deleted results fetched successfully');
  } catch (error) {
    return ApiResponses.error(error, 'Failed to fetch quiz results');
  }
}


}
