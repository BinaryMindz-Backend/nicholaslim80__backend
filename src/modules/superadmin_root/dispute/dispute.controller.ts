import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
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
findAll(@Query() dto: DisputeQueryDto) {
  return this.service.findAll(dto);
}

@Post('resolve')
@Auth()
@ApiBearerAuth()
@ApiOperation({ summary: 'Resolve dispute (Admin)' })
resolve(@Body() dto: ResolveDisputeDto) {
  return this.service.resolve(dto);
}

// Get one dispute
@Get(':id')
@Auth()
@ApiBearerAuth()
@ApiOperation({ summary: 'Get one dispute (User / Rider / Admin)' })
findOne(@Param('id') id: string) {
  return this.service.findOne(+id);
}

// Delete dispute
@Delete(':id')
@Auth()
@ApiBearerAuth()
@ApiOperation({ summary: 'Delete dispute (User / Rider / Admin)' })
delete(@Param('id') id: string) {
  return this.service.delete(+id);
}

// Close case
@Patch(':id')
@Auth()
@ApiBearerAuth()
@ApiOperation({ summary: 'Close dispute case (User / Rider / Admin)' })
closeCase(@Param('id') id: string) {
  return this.service.closeCase(+id);
}

}
