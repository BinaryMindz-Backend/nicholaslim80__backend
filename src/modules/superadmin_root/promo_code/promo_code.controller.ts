import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { PromoCodeService } from './promo_code.service';
import { CreatePromoCodeDto } from './dto/create-promo_code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo_code.dto';
import { ApiResponses } from 'src/common/apiResponse';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Auth } from 'src/decorators/auth.decorator';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';

@ApiTags('Promo Codes')
@Controller('promo-codes')

export class PromoCodeController {
  constructor(private readonly promoService: PromoCodeService) {}

  @Post()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.PROMO_CODE, Permission.CREATE)
  @ApiOperation({ summary: 'Create a new promo code' })
  @ApiBody({ type: CreatePromoCodeDto })
  @ApiResponse({ status: 201, description: 'Promo code created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid data or promo code already exists.' })
  async create(@Body() dto: CreatePromoCodeDto) {
    const result = await this.promoService.create(dto);
    if (!result.success) {
      return ApiResponses.error(result.error, result.message);
    }
    return ApiResponses.success(result.data, result.message);
  }

  @Get()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.PROMO_CODE, Permission.CREATE)
  @ApiOperation({ summary: 'Get all promo codes' })
  @ApiResponse({ status: 200, description: 'List of promo codes.' })
  @ApiResponse({ status: 500, description: 'Failed to fetch promo codes.' })
  async findAll() {
    const result = await this.promoService.findAll();
    if (!result.success) {
      return ApiResponses.error(result.error, result.message);
    }
    return ApiResponses.success(result.data, result.message);
  }

  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.PROMO_CODE, Permission.CREATE)
  @ApiOperation({ summary: 'Get a promo code by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Promo code details.' })
  @ApiResponse({ status: 404, description: 'Promo code not found or inactive/expired.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.promoService.findOne(id);
    if (!result.success) {
      return ApiResponses.error(result.error, result.message);
    }
    return ApiResponses.success(result.data, result.message);
  }

  @Put(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.PROMO_CODE, Permission.CREATE)
  @ApiOperation({ summary: 'Update a promo code by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdatePromoCodeDto })
  @ApiResponse({ status: 200, description: 'Promo code updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid data or duplicate promo code.' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePromoCodeDto) {
    const result = await this.promoService.update(id, dto);
    if (!result.success) {
      return ApiResponses.error(result.error, result.message);
    }
    return ApiResponses.success(result.data, result.message);
  }

  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.PROMO_CODE, Permission.CREATE)
  @ApiOperation({ summary: 'Delete a promo code by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Promo code deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Promo code not found.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.promoService.remove(id);
    if (!result.success) {
      return ApiResponses.error(result.error, result.message);
    }
    return ApiResponses.success(result.data, result.message);
  }
}
