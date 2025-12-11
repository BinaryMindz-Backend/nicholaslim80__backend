import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ContentManagementService } from './content_management.service';
import { CreateContentManagementDto } from './dto/create-content_management.dto';
import { UpdateContentManagementDto } from './dto/update-content_management.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { Auth } from 'src/decorators/auth.decorator';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/decorators/roles.decorator';

@Controller('content-management')
export class ContentManagementController {
  constructor(
    private readonly contentManagementService: ContentManagementService,
  ) {}

  @Post()
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  async create(@Body() createContentManagementDto: CreateContentManagementDto) {
    try {
      const data = await this.contentManagementService.create(
        createContentManagementDto,
      );
      return ApiResponses.success(
        data,
        ` ${createContentManagementDto.contenttype} content create successfully `,
      );
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Get()
  async findAll() {
    try {
      const res = await this.contentManagementService.findAll();
      return ApiResponses.success(
        res,
        'All content management fetched successfully',
      );
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Get(':id')

  async findOne(@Param('id') id: string) {
    try {
      const res = await this.contentManagementService.findOne(+id);
      return ApiResponses.success(
        res,
        `${id} content details fetch successfully`,
      );
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Patch(':id')
   @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateContentManagementDto: UpdateContentManagementDto,
  ) {
    try {
      const res = await this.contentManagementService.update(
        +id,
        updateContentManagementDto,
      );
      return ApiResponses.success(
        res,
        `${id} content update fetch successfully`,
      );
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Delete(':id')
   @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    try {
      await this.contentManagementService.remove(+id);
      return ApiResponses.success(null, `${id} content deleted successfully`);
    } catch (error) {
      return ApiResponses.error(error);
    }
  }
}
