import { Controller, Post, Body, Param, Query, Get, Delete, ParseIntPipe, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { AddMoneyDto, addMoneyForOrderPriorityDto, PayWithSavedCardDto, WithdrawDto } from './dto/wallet.dto';
import { Auth } from 'src/decorators/auth.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ApiResponses } from 'src/common/apiResponse';
import type { IUser } from 'src/types';
import { AddMoneyTestDto } from './dto/add-money-test.dto';
import { UserWalletQueryDto } from './dto/user-wallet.dto';
import { UserWalletHistoryQueryDto } from './dto/user-wallet-history-query.dto';
import { CreatePaymentIntentDto, SaveCardDto } from './dto/create-payment-method.dto';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';


@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }



    // 
    @Post('earn-money')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get rider earning summary' })
    @ApiQuery({ name: 'date', required: false, type: String })
    async earnMoney(
        @CurrentUser() user: IUser,
        @Query('date') date?: string,
    ) {
        const parsedDate = date ? new Date(date) : undefined;

        const result = await this.walletService.earnMoney(
            +user.id,
            parsedDate,
        );

        return ApiResponses.success(
            result,
            'Earning summary fetched successfully',
        );
    }




    // add money for web portal
    @Post('add-money')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add money to user wallet' })
    async addMoney(
        @Body() dto: AddMoneyDto,
        @CurrentUser() user: IUser
    ) {
        const result = await this.walletService.addMoney(+user.id, dto.amount, dto.currency, dto.paymentMethodId, dto.payType);
        return ApiResponses.success(result, 'Money added to wallet successfully');
    }

    // add money for mobile
    @Post('add-money/mobile')
    @Auth()
    @ApiOperation({ summary: 'Add money to user wallet from mobile' })
    async addMoneyMobile(
        @Body() dto: CreatePaymentIntentDto,
        @CurrentUser() user: IUser
    ) {
        // console.log("dto from--> mobile-->", dto);
        const result = await this.walletService.createIntent(+user.id, dto.amount, dto.currency, dto.orderId, dto.payType, dto.type);
        return ApiResponses.success(result, 'Pay to wallet successfully');
    }

    // 
    @Post('create-setup-intent')
    @ApiOperation({ summary: 'Create Stripe SetupIntent to save card' })
    async createSetupIntent(@CurrentUser() user: IUser) {
        return this.walletService.createSetupIntent(user.id);
    }

    @Post('save-card')
    @ApiOperation({ summary: 'Save a payment method to user Stripe account' })
    async saveCard(@CurrentUser() user: IUser, @Body() dto: SaveCardDto) {
        const { paymentMethodId } = dto;
        return this.walletService.saveCard(user.id, paymentMethodId);
    }

    @Post('wallet/pay')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Pay using a saved card' })
    async payWithSavedCard(
        @Body() dto: PayWithSavedCardDto,
        @CurrentUser() user: IUser
    ) {
        try {
            const res = await this.walletService.payWithSavedCard(user.id, dto.amount, dto.paymentMethodId, dto.payType);
            return ApiResponses.success(res, 'Payment successful');
        } catch (err) {
            console.log(err);
            return ApiResponses.error(err.message || err, 'Payment failed');
        }
    }




    // 
    @Get('wallet/cards')
    @Auth()
    async getCards(@CurrentUser() user: IUser) {
        return this.walletService.getSavedCards(user.id);
    }


    @Post('withdraw')
    @Auth()
    @ApiOperation({ summary: 'Withdraw money from wallet to user bank/Stripe account' })
    async withdraw(
        @Body() dto: WithdrawDto,
        @CurrentUser() user: IUser
    ) {
        const result = await this.walletService.withdraw(+user.id, dto.amount, dto.currency!);
        return ApiResponses.success(result, 'Withdrawal request processed successfully');
    }
    // 
    @Post('add-money-priority')
    @Auth()
    @ApiOperation({ summary: 'Add money to wallet using Stripe test token' })
    @ApiBody({ type: addMoneyForOrderPriorityDto })
    async addMoneyForOrderPriority(@CurrentUser() user: IUser, @Body() dto: addMoneyForOrderPriorityDto) {
        try {
            const res = await this.walletService.addMoneyForOrderPriority(+user.id, dto.amount, dto.currency);
            return ApiResponses.success(res, 'Money added to wallet successfully');

        } catch (error) {
            console.log(error);
            return ApiResponses.error(error.message || error, 'Failed to add money to wallet');
        }

    }

    // 
    @Get('get-add-money-priority')
    @Auth()
    @ApiOperation({ summary: 'Get user wallet by role with search and pagination' })
    async getAddMoneyForOrderPriority(@CurrentUser() user: IUser) {
        try {
            const res = await this.walletService.getAddMoneyForOrderPriority(+user.id);
            return ApiResponses.success(res, 'Data retrieved successfully');
        } catch (error) {
            console.log(error);
            return ApiResponses.error(error.message || error, 'Failed to get data');

        }
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
    // @Get('user/wallet')
    // @RequirePermission(Module.RAIDER, Permission.JUST_ADMIN)
    // @Auth()
    // @ApiOperation({ summary: 'Get user wallet by role with search and pagination' })
    // async userWallet(@Query() query: UserWalletQueryDto) {
    //     return this.walletService.userWallet(query);
    // }

    // Admin Module Access
    @Get('/user/wallet')
    @RequirePermission(Module.WALLET, Permission.READ) // Higher permission
    @Auth()
    async adminUserWallet(@Query() query: UserWalletQueryDto) {
        return this.walletService.userWallet(query);
    }

    // Raider Module Access
    @Get('raider/wallet')
    @RequirePermission(Module.WALLET, Permission.READ) // Lower permission
    @Auth()
    async raiderUserWallet(@Query() query: UserWalletQueryDto) {
        return this.walletService.userWallet(query);
    }
    // remove card
    @Delete('wallet/cards/:id')
    @Auth()
    async deleteCard(@Param('id') id: string, @CurrentUser() user: IUser) {
        return this.walletService.deleteCard(user.id, Number(id));
    }


    // 
    @Get('user/walletHistory/:userId')
    @Auth()
    @ApiOperation({ summary: 'Get user wallet history by id' })
    @ApiParam({ name: 'userId', required: true, type: String, example: '1' })
    async userWalletHistory(@Param('userId') userId: string, @Query() query: UserWalletHistoryQueryDto) {
        return this.walletService.userWalletHistory(+userId, query);
    }
    // 
    @Delete('remove/:id')
    @Auth()
    @ApiOperation({ summary: "Deleted Walllet history" })
    @ApiParam({ name: "id", required: true, type: String, example: 1 })
    async remove(@Param("id", new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: string) {
        try {
            await this.walletService.delete(+id)
            return ApiResponses.success(null, "wallet history deleted succssfully")
        } catch (error) {
            return ApiResponses.error(error, "Feaild to delete")
        }
    }


}

