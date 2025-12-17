import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AboutusService } from './aboutus.service';
import { CreateAboutusDto } from './dto/create-aboutus.dto';
import { UpdateAboutusDto } from './dto/update-aboutus.dto';
import { ApiResponses } from 'src/common/apiResponse';

@Controller('aboutus')
export class AboutusController {
  constructor(private readonly aboutusService: AboutusService) { }

  @Post()
  async create(@Body() createAboutusDto: CreateAboutusDto) {
    try {
      const data = await this.aboutusService.create(createAboutusDto);
      return ApiResponses.success(data, 'About Us created successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  @Get()
  async findAll() {
    try {
      const data = await this.aboutusService.findAll();
      return ApiResponses.success(data, 'About Us fetched successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  @Patch('changeStatus/:id')
  async changeStatus(@Param('id') id: string) {
    try {
      await this.aboutusService.changeStatus(+id);
      return ApiResponses.success(null, 'About Us status changed successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateAboutusDto: UpdateAboutusDto) {
    try {
      const data = await this.aboutusService.update(+id, updateAboutusDto);
      return ApiResponses.success(data, 'About Us updated successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const data = await this.aboutusService.remove(+id);
      return ApiResponses.success(data, 'About Us removed successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }
}
