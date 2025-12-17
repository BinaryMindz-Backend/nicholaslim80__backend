import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';

@Controller('dispute')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) { }

  @Post('create')
  async create(@Body() createDisputeDto: CreateDisputeDto) {
    return await this.disputeService.create(createDisputeDto);
  }

  @Get()
  async findAll() {
    return await this.disputeService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.disputeService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDisputeDto: UpdateDisputeDto) {
    return await this.disputeService.update(+id, updateDisputeDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.disputeService.remove(+id);
  }
}
