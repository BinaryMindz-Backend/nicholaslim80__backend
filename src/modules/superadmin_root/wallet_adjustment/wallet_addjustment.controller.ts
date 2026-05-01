/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { WalletAdjustmentDto } from './dto/wallet_adj.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';
import { WalletAdjustmentService } from './wallet_addjustment.services';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiResponses } from 'src/common/apiResponse';

@Controller('admin/wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class WalletAdjustmentController {
  constructor(private readonly walletService: WalletAdjustmentService) {}

  @Post('adjust')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.WALLET, Permission.CREATE)
  async adjustWallet(@Body() dto: WalletAdjustmentDto, @CurrentUser() user: IUser) {
    const result = await this.walletService.adjustWallet(dto, user.id);
    if (result instanceof Error) throw result;
    return ApiResponses.success(result, 'Wallet adjusted successfully');
  }
}