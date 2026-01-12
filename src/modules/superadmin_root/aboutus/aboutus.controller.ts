import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AboutusService } from './aboutus.service';
import { CreateAboutusDto } from './dto/create-aboutus.dto';
import { UpdateAboutusDto } from './dto/update-aboutus.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { Auth } from 'src/decorators/auth.decorator';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('aboutus')
export class AboutusController {
  constructor(private readonly aboutusService: AboutusService) { }

  @Post()
  @Auth()
  @RequirePermission(Module.CONTENT_MANAGEMENT, Permission.CREATE)
  @ApiBearerAuth()
  async create(@Body() createAboutusDto: CreateAboutusDto) {
    try {
      const data = await this.aboutusService.create(createAboutusDto);
      return ApiResponses.success(data, 'About Us created successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  @Get()
  @Auth()
  @RequirePermission(Module.CONTENT_MANAGEMENT, Permission.READ)
  @ApiBearerAuth()
  async findAll() {
    try {
      const data = await this.aboutusService.findAll();
      return ApiResponses.success(data, 'About Us fetched successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  @Patch('changeStatus/:id')
  @Auth()
  @RequirePermission(Module.CONTENT_MANAGEMENT, Permission.UPDATE)
  @ApiBearerAuth()
  async changeStatus(@Param('id') id: string) {
    try {
      await this.aboutusService.changeStatus(+id);
      return ApiResponses.success(null, 'About Us status changed successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  @Patch(':id')
  @Auth()
  @RequirePermission(Module.CONTENT_MANAGEMENT, Permission.UPDATE)
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() updateAboutusDto: UpdateAboutusDto) {
    try {
      const data = await this.aboutusService.update(+id, updateAboutusDto);
      return ApiResponses.success(data, 'About Us updated successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  @Delete(':id')
  @Auth()
  @RequirePermission(Module.CONTENT_MANAGEMENT, Permission.DELETE)
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    try {
      const data = await this.aboutusService.remove(+id);
      return ApiResponses.success(data, 'About Us removed successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }
}
