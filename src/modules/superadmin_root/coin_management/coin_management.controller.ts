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
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'User reedom coin (Only USER role)' })
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


  @Get('reedom-coin-history-all-users')
  @ApiOperation({ summary: 'User reedom coin  History (Only SUPER_ADMIN role)' })
  // @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  async reedomCoinHistory() {
    try {
      const data = await this.coinManagementService.reedomCoinHistory();
      return ApiResponses.success(
        data,
        `User coin history fetched successfully `,
      );
    } catch (error) {
      return ApiResponses.error(error);
    }
  }



  @Get('user-wallet-history/:userId')
  @ApiOperation({ summary: 'User wallet history (Only SUPER_ADMIN role)' })
  // @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  async userWalletHistory(@Param('userId') userId: string) {
    try {
      const data = await this.coinManagementService.userWalletHistory(+userId);
      return ApiResponses.success(
        data,
        `User wallet history fetched successfully `,
      );
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

}