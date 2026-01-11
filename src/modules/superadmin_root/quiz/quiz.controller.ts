import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { Auth } from 'src/decorators/auth.decorator';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';


@ApiTags('quizzes')
@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) { }

  @Post()
  @UsePipes(new ValidationPipe())
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.QUIZ, Permission.CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new quiz (admin only)' })
  @ApiBody({ type: CreateQuizDto })
  @ApiResponse({ status: 201, description: 'Quiz created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() createQuizDto: CreateQuizDto) {
    try {
      const res = await this.quizService.create(createQuizDto);
      if (!res) {
        return ApiResponses.error(null, 'Failed to create quiz');
      }
      return ApiResponses.success(res, 'Quiz created successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to create quiz');
    }
  }

  @Get()
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.QUIZ, Permission.READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all quizzes' })
  @ApiResponse({ status: 200, description: 'Return all quizzes' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll() {
    try {
      const res = await this.quizService.findAll();
      return ApiResponses.success(res, 'Quizzes fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch quizzes');
    }
  }
  //get active quizzes
  @Get('active')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.QUIZ, Permission.GET_ONE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active quiz' })
  @ApiResponse({ status: 200, description: 'Return active quiz' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findOneActive() {
    try {
      const res = await this.quizService.findActiveQuiz();
      return ApiResponses.success(res, 'Quiz fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch quiz');
    }
  }




  @Get(':id')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN, UserRole.RAIDER)
  @RequirePermission(Module.QUIZ, Permission.GET_ONE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a quiz by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID of the quiz' })
  @ApiResponse({ status: 200, description: 'Return the quiz' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findOne(@Param('id') id: string) {
    try {
      const res = await this.quizService.findOne(+id);
      if (!res) {
        return ApiResponses.error(null, 'Quiz not found');
      }
      return ApiResponses.success(res, 'Quiz fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch quiz');
    }
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.QUIZ, Permission.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a quiz (admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID of the quiz' })
  @ApiBody({ type: UpdateQuizDto })
  @ApiResponse({ status: 200, description: 'Quiz updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async update(@Param('id') id: string, @Body() updateQuizDto: UpdateQuizDto) {
    try {
      const res = await this.quizService.update(+id, updateQuizDto);
      if (!res) {
        return ApiResponses.error(null, 'Quiz not found');
      }
      return ApiResponses.success(res, 'Quiz updated successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to update quiz');
    }
  }

  @Delete(':id')
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.QUIZ, Permission.DELETE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a quiz (admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID of the quiz' })
  @ApiResponse({ status: 200, description: 'Quiz deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async remove(@Param('id') id: string) {
    try {
      const res = await this.quizService.remove(+id);
      if (!res) {
        return ApiResponses.error(null, 'Quiz not found');
      }
      return ApiResponses.success(res, 'Quiz deleted successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to delete quiz');
    }
  }
}
