import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DisputeService } from './dispute.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { DisputeQueryDto } from './dto/dispute-query.dto';
import { Auth } from 'src/decorators/auth.decorator';

@ApiTags('Disputes')
@Controller('disputes')
export class DisputeController {
  constructor(private readonly service: DisputeService) {}

  @Post()
  @ApiOperation({ summary: 'Create dispute (User / Rider)' })
  @Auth()
  @ApiBearerAuth()
  create(@Body() dto: CreateDisputeDto) {
    return this.service.create(dto);
  }

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get disputes (User / Rider / Admin)' })
  findAll(@Query() query: DisputeQueryDto) {
    return this.service.findAll(query);
  }

  @Post('resolve')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve dispute (Admin)' })
  resolve(@Body() dto: ResolveDisputeDto) {
    return this.service.resolve(dto);
  }
}
