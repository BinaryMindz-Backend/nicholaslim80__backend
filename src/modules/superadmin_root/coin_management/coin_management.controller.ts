import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CoinManagementService } from './coin_management.service';
import { UpdateCoinManagementDto } from './dto/update-coin_management.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { Auth } from 'src/decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Permission, Module } from 'src/rbac/rbac.constants';
import { CreateCoinDto } from './dto/create-coin_management.dto';
import { DateByFilterDto } from '../customer_order_confirmation/dto/date-filter.dto';

@Controller('coin-management')
export class CoinManagementController {
  constructor(private readonly coinManagementService: CoinManagementService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new coin (Only SUPER_ADMIN role)' })
  @Auth()
  @RequirePermission(Module.CUSTOMER_REWARDS, Permission.CREATE)
  // @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  async create(@Body() createCoinManagementDto: CreateCoinDto, @CurrentUser() user:IUser) {
    try {

      const res = await this.coinManagementService.create(
        createCoinManagementDto,
        user.roles[0].name,
        user.id
      );
      return ApiResponses.success(res, 'Coin created successfully ');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Get()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.CUSTOMER_REWARDS, Permission.READ)
  @ApiOperation({ summary: 'Get all coins (Only SUPER_ADMIN role)' })
  async findAll() {
    try {
      const res = await this.coinManagementService.findAll();
      return ApiResponses.success(res, 'All coin data fetched successfully ');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }
  //  
  @Get('logs')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.CUSTOMER_REWARDS, Permission.READ)
  @ApiOperation({ summary: 'Get all coin configuration change logs (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Coin configuration logs fetched successfully',
  })
  @ApiQuery({ type: DateByFilterDto })
  async findAllLogs(@Query() filterDto: DateByFilterDto) {
    try {
      const res = await this.coinManagementService.findAllLogs(
        filterDto.fromDate,
        filterDto.toDate,
      );

      return ApiResponses.success(
        res,
        'Coin configuration logs fetched successfully',
      );
    } catch (err) {
      return ApiResponses.error(
        err,
        'Failed to fetch coin configuration logs',
      );
    }
  }


  //  
  @Get('base-price')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get avg base price' })
  async basePrice() {
    try {
      // 
      const res = await this.coinManagementService.basePrice();
      return ApiResponses.success(res, 'Get Coin Avg base price Successfully ');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  //  
  @Post('collect-coin')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Collect coin' })
  async collectCoin(@CurrentUser() user: IUser, @Query('coin') coin: number) {
    try {
      // 
      const res = await this.coinManagementService.collectCoin(+user.id, coin);
      return ApiResponses.success(res, 'Coin collected successfully ');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  // 
  @Get('coin-accounts')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all user coin accounts with search' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'username', required: false, type: String })
  async findAllCoinAcc(
    @Query('userId') userId?: string,
    @Query('username') username?: string,
  ) {
    try {
      // 
      const res = await this.coinManagementService.findAllCoinAcc({
        userId: userId ? Number(userId) : undefined,
        username,
      });
      return ApiResponses.success(res, 'Coin Data Get Successfully ');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }


  @Patch(':id')
  @ApiOperation({ summary: 'Update coin data (Only SUPER_ADMIN role)' })
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @RequirePermission(Module.CUSTOMER_REWARDS, Permission.UPDATE)
  async update(
    @Param('id') id: string,
    @Body() updateCoinManagementDto: UpdateCoinManagementDto,
    @CurrentUser() user:IUser 
  ) {
    try {
      const data = await this.coinManagementService.update(
        +id,
        updateCoinManagementDto,
        user.roles[0].name,
        user.id
      );
      return ApiResponses.success(data, 'Coin Data updated Successfully ');
    } catch (error) {
      return ApiResponses.error(error);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete coin data (Only SUPER_ADMIN role)' })
  @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @RequirePermission(Module.CUSTOMER_REWARDS, Permission.DELETE)
  @ApiBearerAuth()
  async remove(@Param('id') id: string, @CurrentUser() user:IUser) {
    try {
      const data = await this.coinManagementService.remove(+id,user.roles[0].name,
        user.id);
      return ApiResponses.success(
        data,
        `${id} coin information is deleted successfully `,
      );
    } catch (error) {
      return ApiResponses.error(error);
    }
  }
  // 
  @Post('redeem-coin')
  @ApiOperation({ summary: 'User reedom coin (Only USER role)' })
  @Auth()
  // @Roles(UserRole.USER)
  @RequirePermission(Module.CUSTOMER_REWARDS, Permission.REEDOM_COIN)
  @ApiBearerAuth()
  @RequirePermission(Module.CUSTOMER_REWARDS, Permission.READ)
  async reedomCoin(@Query('coin') coin: string, @CurrentUser() user: IUser,) {
    try {
      const data = await this.coinManagementService.redeemCoin(user, +coin);
      return ApiResponses.success(
        data,
        `User coin reedomed successfully `,
      );
    } catch (error) {
      return ApiResponses.error(error);
    }
  }


  @Get('coin-acc-history/:userId')
  @ApiOperation({ summary: 'User wallet history (Only SUPER_ADMIN role)' })
  // @Auth()
  // @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @RequirePermission(Module.CUSTOMER_REWARDS, Permission.READ)
  async userWalletHistory(@Param('userId') userId: string) {
    try {
      const data = await this.coinManagementService.coinAccHistory(+userId);
      return ApiResponses.success(
        data,
        `User coin acc history fetched successfully `,
      );
    } catch (error) {
      return ApiResponses.error(error);
    }
  }
  // 

}