import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateRatingDto, RatingType } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { RatingService } from './ratings.service';
import { ApiResponses } from 'src/common/apiResponse';



@ApiTags('Ratings')
@Controller('ratings')
@Auth()
@ApiBearerAuth()
export class RatingController {
  constructor(private readonly service: RatingService) { }

  @Post()
  @ApiOperation({ summary: 'Create rating (raider or customer)' })
  async create(@Body() dto: CreateRatingDto) {
    try {
      const res = await this.service.create(dto);
      return ApiResponses.success(res, 'Rating created successfully');
    } catch (error) {
      return ApiResponses.error(error.message ?? error);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all ratings by type' })
  async findAll(@Query('type') type: RatingType) {
    try {
      const res = await this.service.findAll(type);
      return ApiResponses.success(res, 'Ratings fetched successfully');
    } catch (error) {
      return ApiResponses.error(error.message ?? error);
    }
  }

  @Get(':type/:id')
  @ApiOperation({ summary: 'Get rating by ID and type' })
  async findOne(
    @Param('type') type: RatingType,
    @Param('id') id: string,
  ) {
    try {
      const res = await this.service.findOne(type, +id);
      return ApiResponses.success(res, 'Rating fetched successfully');
    } catch (error) {
      return ApiResponses.error(error.message ?? error);
    }
  }

  @Patch(':type/:id')
  @ApiOperation({ summary: 'Update rating' })
  async update(
    @Param('type') type: RatingType,
    @Param('id') id: string,
    @Body() dto: UpdateRatingDto,
  ) {
    try {
      const res = await this.service.update(type, +id, dto);
      return ApiResponses.success(res, 'Rating updated successfully');
    } catch (error) {
      return ApiResponses.error(error.message ?? error);
    }
  }

  @Delete(':type/:id')
  @ApiOperation({ summary: 'Delete rating' })
  async remove(
    @Param('type') type: RatingType,
    @Param('id') id: string,
  ) {
    try {
      const res = await this.service.remove(type, +id);
      return ApiResponses.success(res, 'Rating deleted successfully');
    } catch (error) {
      return ApiResponses.error(error.message ?? error);
    }
  }
}
