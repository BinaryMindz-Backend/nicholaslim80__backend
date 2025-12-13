import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CoinManagementService } from './coin_management.service';
import { CreateCoinManagementDto } from './dto/create-coin_management.dto';
import { UpdateCoinManagementDto } from './dto/update-coin_management.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { Auth } from 'src/decorators/auth.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';

@Controller('coin-management')
export class CoinManagementController {
  constructor(private readonly coinManagementService: CoinManagementService) { }

  @Post()
  async create(@Body() createCoinManagementDto: CreateCoinManagementDto) {
    try {
      const res = await this.coinManagementService.create(
        createCoinManagementDto,
      );
      return ApiResponses.success(res, 'Coin created successfully ');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Get()
  async findAll() {
    try {
      const res = await this.coinManagementService.findAll();
      return ApiResponses.success(res, 'All coin data fetched successfully ');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCoinManagementDto: UpdateCoinManagementDto,
  ) {
    try {
      const data = await this.coinManagementService.update(
        +id,
        updateCoinManagementDto,
      );
      return ApiResponses.success(data, 'Coin Data updated Successfully ');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const data = await this.coinManagementService.remove(+id);
      return ApiResponses.success(
        data,
        `${id} coin information is deleted successfully `,
      );
    } catch (error) {
      return ApiResponses.error(error);
    }
  }
  @Post('reedom-coin/:id')
  @Auth()
  @Roles(UserRole.USER)
  @ApiBearerAuth()
  async reedomCoin(@Param('id') id: string, @CurrentUser() user: IUser,) {
    try {
      const data = await this.coinManagementService.reedomCoin(user, +id);
      return ApiResponses.success(
        data,
        `User coin reedomed successfully `,
      );
    } catch (error) {
      return ApiResponses.error(error);
    }
  }
}
