import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Patch, 
  Post, 
  Query,
  HttpStatus,
  HttpException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DisputeService } from './dispute.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { DisputeQueryDto } from './dto/dispute-query.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiResponses } from 'src/common/apiResponse';

@ApiTags('Disputes') 
@Controller('disputes')
export class DisputeController {
  constructor(private readonly service: DisputeService) {}

  @Post()
  @ApiOperation({ summary: 'Create dispute (User / Rider)' })
  @Auth()
  @ApiBearerAuth()
  async create(@Body() dto: CreateDisputeDto) {
    try {
      const res = await this.service.create(dto);
      
      if (!res) {
        throw new HttpException(
          'Failed to create dispute',
          HttpStatus.BAD_REQUEST
        );
      }
      
      return ApiResponses.success(res, 'Dispute created successfully');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      return ApiResponses.error(error, 'Failed to create dispute');
    }
  }

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get disputes (User / Rider / Admin)' })
  async findAll(@Query() dto: DisputeQueryDto) {
    try {
      const res = await this.service.findAll(dto);
      return ApiResponses.success(res, 'Disputes fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch disputes');
    }
  }

  @Post('resolve')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve dispute (Admin)' })
  async resolve(@Body() dto: ResolveDisputeDto) {
    try {
      const res = await this.service.resolve(dto);
      
      if (!res) {
        throw new HttpException(
          'Failed to resolve dispute',
          HttpStatus.BAD_REQUEST
        );
      }
      
      return ApiResponses.success(res, 'Dispute resolved successfully');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      return ApiResponses.error(error, 'Failed to resolve dispute');
    }
  }

  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one dispute (User / Rider / Admin)' })
  async findOne(@Param('id') id: string) {
    try {
      const res = await this.service.findOne(+id);
      
      if (!res) {
        throw new HttpException(
          'Dispute not found',
          HttpStatus.NOT_FOUND
        );
      }
      
      return ApiResponses.success(res, 'Dispute fetched successfully');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      return ApiResponses.error(error, 'Failed to fetch dispute');
    }
  }

  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete dispute (User / Rider / Admin)' })
  async delete(@Param('id') id: string) {
    try {
      const res = await this.service.delete(+id);
      
      if (!res) {
        throw new HttpException(
          'Failed to delete dispute',
          HttpStatus.BAD_REQUEST
        );
      }
      
      return ApiResponses.success(res, 'Dispute deleted successfully');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      return ApiResponses.error(error, 'Failed to delete dispute');
    }
  }

  @Patch(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Close dispute case (User / Rider / Admin)' })
  async closeCase(@Param('id') id: string) {
    try {
      const res = await this.service.closeCase(+id);
      
      if (!res) {
        throw new HttpException(
          'Failed to close dispute case',
          HttpStatus.BAD_REQUEST
        );
      }
      
      return ApiResponses.success(res, 'Dispute case closed successfully');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      return ApiResponses.error(error, 'Failed to close dispute case');
    }
  }
}