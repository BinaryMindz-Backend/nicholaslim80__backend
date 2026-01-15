import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TipService } from './tip.service';
import { CreateTipDto } from './dto/create-tip.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { Auth } from 'src/decorators/auth.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';



@ApiTags('Tips')
@Controller('tips')
export class TipController {
  constructor(private readonly tipService: TipService) { }

  @Post(':order_id/tip')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tip the raider for completed order' })
  @ApiResponse({ status: 201, description: 'Tip created successfully' })
  async createTip(
    @Param('order_id', ParseIntPipe) orderId: number,
    @CurrentUser() user: IUser,
    @Body() dto: CreateTipDto,
  ) {
    try {
      const result = await this.tipService.createTip(user.id, dto, orderId);
      return ApiResponses.success(result, 'Tip sent successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to send tip');
    }
  }

  @Get(':order_id/tips')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tips for an order' })
  async getOrderTips(
    @Param('order_id', ParseIntPipe) orderId: number,
    @CurrentUser() user: IUser,
  ) {
    try {
      const tips = await this.tipService.getOrderTips(orderId, user.id);
      return ApiResponses.success(tips, 'Tips retrieved successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to get tips');
    }
  }

  @Get('raider/tips')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get raider total tips (raider only)' })
  async getRaiderTips(@CurrentUser() user: IUser) {
    try {
      const tips = await this.tipService.getRaiderTips(user.id);
      return ApiResponses.success(tips, 'Raider tips retrieved');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to get raider tips');
    }
  }

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all tips (admin only)' })
  async getAllTips() {
    try {
      const result = await this.tipService.findAll();
      return ApiResponses.success(result, 'Tips retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to retrieve tips');
    }
  }

  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tip by id (admin only)' })
  async getTipById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const result = await this.tipService.findOne(id);
      return ApiResponses.success(result, 'Tip retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to retrieve tip');
    }
  }


}
