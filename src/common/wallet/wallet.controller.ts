import { Controller, Post, Body, Param, Query, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { AddMoneyDto, SavePaymentMethodDto, WithdrawDto } from './dto/wallet.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ApiResponses } from 'src/common/apiResponse';
import type { IUser } from 'src/types';
import { AddMoneyTestDto } from './dto/add-money-test.dto';
import { UserWalletQueryDto } from './dto/user-wallet.dto';
import { UserWalletHistoryQueryDto } from './dto/user-wallet-history-query.dto';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Post('add-money')
    @Auth()
    @ApiOperation({ summary: 'Add money to user wallet' })
    async addMoney(
        @Body() dto: AddMoneyDto,
        @CurrentUser() user: IUser
    ) {
        const result = await this.walletService.addMoney(+user.id, dto.amount, dto.paymentMethodId);
        return ApiResponses.success(result, 'Money added to wallet successfully');
    }

    @Post('save-payment-method')
    @Auth()
    @ApiOperation({ summary: 'Save a payment method for future use' })
    async savePaymentMethod(
        @Body() dto: SavePaymentMethodDto,
        @CurrentUser() user: IUser
    ) {
        const result = await this.walletService.savePaymentMethod(
            +user.id,
            dto.paymentMethodId,
            dto.type,
            dto.last4,
            dto.expMonth,
            dto.expYear,
            dto.isDefault
        );
        return ApiResponses.success(result, 'Payment method saved successfully');
    }

    @Post('withdraw')
    @Auth()
    @ApiOperation({ summary: 'Withdraw money from wallet to user bank/Stripe account' })
    async withdraw(
        @Body() dto: WithdrawDto,
        @CurrentUser() user: IUser
    ) {
        const result = await this.walletService.withdraw(+user.id, dto.amount);
        return ApiResponses.success(result, 'Withdrawal request processed successfully');
    }
    // 
    @Post('add-money/test/:userId')
    @Auth()
    @ApiOperation({ summary: 'Add money to wallet using Stripe test token' })
    @ApiBody({ type: AddMoneyTestDto })
    async addMoneyTest(@Param('userId') userId: string, @Body() dto: AddMoneyTestDto) {
        return this.walletService.addMoneyTest(+userId, dto.amount, dto.testToken);
    }

    // 
    @Get('user/wallet')
    @Auth()
    @ApiOperation({ summary: 'Get user wallet by role with search and pagination' })
    async userWallet(@Query() query: UserWalletQueryDto) {
        return this.walletService.userWallet(query);
    }


    // 
    @Get('user/walletHistory/:userId')
    @Auth()
    @ApiOperation({ summary: 'Get user wallet history by id' })
    @ApiParam({ name: 'userId', required: true, type: String, example: '1' })
    async userWalletHistory(@Param('userId') userId: string, @Query() query: UserWalletHistoryQueryDto) {
        return this.walletService.userWalletHistory(+userId, query);
    }


}

