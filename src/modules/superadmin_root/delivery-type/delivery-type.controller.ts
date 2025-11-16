import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { DeliveryTypeService } from './delivery-type.service';
import { CreateDeliveryTypeDto } from './dto/create-delivery-type.dto';
import { UpdateDeliveryTypeDto } from './dto/update-delivery-type.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/decorators/auth.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ApiResponses } from 'src/common/apiResponse';
import { UserRole } from '@prisma/client';


@ApiTags('Delivery Types (admin)')
@ApiBearerAuth()
@Controller('delivery-types')
export class DeliveryTypeController {
  constructor(private readonly service: DeliveryTypeService) {}
  
  // create delivery type
  @Post('create')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create Delivery Type (Admin only)' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@CurrentUser() user: any,
    @Body() dto: CreateDeliveryTypeDto,
  ) {
    try {
      const result = await this.service.create(dto,user);
      return ApiResponses.success(result, 'Delivery type created');
    } catch (err) {
      return ApiResponses.error(err, 'Creation failed');
    }
  }
  // 
  @Get()
  @Auth()
  @ApiOperation({ summary: 'Get all Delivery Types' })
  async findAll() {
    try {
      const data = await this.service.findAll();
      return ApiResponses.success(data, 'Delivery types fetched');
    } catch (err) {
      return ApiResponses.error(err, 'Fetch failed');
    }
  }
  // 
  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get single Delivery Type' })
  async findOne(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
    id: number
  ) {
    try {
      const data = await this.service.findOne(id);
      return ApiResponses.success(data, 'Delivery type fetched');
    } catch (err) {
      return ApiResponses.error(err, 'Fetch failed');
    }
  }
  
  // 
  @Patch(':id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update Delivery Type (Admin only)' })
  async update(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
    id: number,
    @Body() dto: UpdateDeliveryTypeDto,
    @CurrentUser() user: any
  ) {
    try {
      const data = await this.service.update(id, dto, user);
      return ApiResponses.success(data, 'Delivery type updated');
    } catch (err) {
      return ApiResponses.error(err, 'Update failed');
    }
  }
   
  // 
  @Delete(':id')
  @Auth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete Delivery Type (Admin only)' })
  async remove(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
    id: number,
    @CurrentUser() user: any
  ) {
    try {
      await this.service.remove(id, user);
      return ApiResponses.success(null, 'Delivery type deleted');
    } catch (err) {
      return ApiResponses.error(err, 'Delete failed');
    }
  }
}
