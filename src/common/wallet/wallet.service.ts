import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletTransactionStatus, WalletTransactionType } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import Stripe from 'stripe';
import { UserWalletQueryDto } from './dto/user-wallet.dto';
import { UserWalletHistoryQueryDto } from './dto/user-wallet-history-query.dto';

@Injectable()
export class WalletService {
    private stripe: Stripe;

    constructor(private prisma: PrismaService) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2025-11-17.clover',
        });
    }

    //   
    // ---------- Add Money (Backend Test using Stripe token) ----------
    async addMoneyTest(userId: number, amount: number, testToken: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // Step 1: Create Stripe Customer if not exist
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await this.stripe.customers.create({
                email: user.email ?? undefined,
                name: user.username ?? undefined,
            });
            customerId = customer.id;
            await this.prisma.user.update({
                where: { id: userId },
                data: { stripeCustomerId: customerId },
            });
        }

        // Step 2: Create a PaymentMethod from test token
        const paymentMethod = await this.stripe.paymentMethods.create({
            type: 'card',
            card: { token: testToken }, // e.g., 'tok_visa'
        });

        // Step 3: Attach PaymentMethod to Customer
        await this.stripe.paymentMethods.attach(paymentMethod.id, { customer: customerId });

        // Step 4: Optionally set as default
        await this.stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: paymentMethod.id },
        });

        // Step 5: Create PaymentIntent
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'usd',
            customer: customerId,
            payment_method: paymentMethod.id,
            off_session: true,
            confirm: true,
        });

        // Step 6: Add wallet history
        await this.prisma.walletHistory.create({
            data: {
                userId,
                type: 'credit',
                amount,
                status: 'SUCCESS',
                transactionType: WalletTransactionType.PAYMENT,
                transactionId: paymentIntent.id,
            },
        });

        // Step 7: Update wallet balance
        await this.prisma.user.update({
            where: { id: userId },
            data: { totalWalletBalance: { increment: amount }, currentWalletBalance: { increment: amount } },
        });

        return {
            message: 'Wallet credited successfully',
            amount,
            paymentIntentId: paymentIntent.id,
        };
    }


    // ---------- Add Money ----------
    async addMoney(userId: number, amount: number, paymentMethodId?: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) throw new NotFoundException('User not found');

        if (!user.email) throw new BadRequestException('User email is not found');

        // Create Stripe Customer if not exist
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await this.stripe.customers.create({
                email: user.email ?? undefined,
                name: user.username ?? undefined,
            });
            customerId = customer.id;
            await this.prisma.user.update({
                where: { id: userId },
                data: { stripeCustomerId: customerId },
            });
        }

        // If paymentMethodId is not provided, use default
        if (!paymentMethodId) {
            const defaultMethod = await this.prisma.paymentMethod.findFirst({
                where: { userId, isDefault: true },
            });
            if (!defaultMethod)
                throw new BadRequestException('No saved payment method found');
            paymentMethodId = defaultMethod.stripeMethodId;
        }

        // Create Payment Intent
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // cents
            currency: 'usd',
            customer: customerId,
            payment_method: paymentMethodId,
            off_session: true,
            confirm: true,
        });

        // Add wallet history
        await this.prisma.walletHistory.create({
            data: {
                userId,
                type: 'credit',
                amount,
                status: "SUCCESS",
                transactionType: WalletTransactionType.PAYMENT,
                transactionId: paymentIntent.id,
            },
        });

        // Update wallet balance
        await this.prisma.user.update({
            where: { id: userId },
            data: { totalWalletBalance: { increment: amount }, currentWalletBalance:{increment:amount} },
        });

        return { message: 'Wallet credited successfully', amount };
    }

    // ---------- Save Payment Method ----------
    async savePaymentMethod(userId: number, paymentMethodId: string, type: string, last4: string, expMonth: number, expYear: number, isDefault = false) {
        // Optionally set all others to isDefault=false if this is default
        if (isDefault) {
            await this.prisma.paymentMethod.updateMany({
                where: { userId },
                data: { isDefault: false },
            });
        }

        return await this.prisma.paymentMethod.create({
            data: {
                userId,
                stripeMethodId: paymentMethodId,
                type,
                last4,
                expMonth,
                expYear,
                isDefault
            },
        });
    }

    // ---------- Withdraw ----------
    async withdraw(userId: number, amount: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) throw new NotFoundException('User not found');
        if (user.totalWalletBalance < amount) throw new BadRequestException('Insufficient balance');

        if (!user.stripeAccountId)
            throw new BadRequestException('User does not have a connected Stripe account');

        // Transfer from your platform (admin) to user's Stripe connected account
        await this.stripe.transfers.create({
            amount: Math.round(amount * 100), // cents
            currency: 'usd',
            destination: user.stripeAccountId,
        });

        // Update wallet and history
        await this.prisma.user.update({
            where: { id: userId },
            data: { totalWalletBalance: { decrement: amount } },
        });

        await this.prisma.walletHistory.create({
            data: {
                userId,
                type: 'debit',
                amount,
                status: WalletTransactionStatus.SUCCESS,
                transactionType: WalletTransactionType.PAYOUT,
                transactionId: "demo"
            }
        });

        return { message: 'Withdrawal successful', amount };
    }

    // user wallet with search and pagination
    async userWallet(dto: UserWalletQueryDto) {
        const page = dto.page || 1;
        const limit = dto.limit || 10;

        const skip = (page - 1) * limit;
        const take = limit;

        const where: any = { role: { name: dto.role } };

        if (dto.search) {
            where.OR = [
                { username: { contains: dto.search, mode: 'insensitive' } },
                { email: { contains: dto.search, mode: 'insensitive' } },
                { phone: { contains: dto.search, mode: 'insensitive' } },
                // { id: { contains: dto.search, mode: 'insensitive' } },
            ];
        }

        const [total, data] = await Promise.all([
            this.prisma.user.count({ where }),
            this.prisma.user.findMany({
                where,
                skip,
                take,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    totalWalletBalance: true,
                    currentWalletBalance: true,
                },
            }),
        ]);
        // 
        return {
            total,
            page,
            limit,
            data,
        };
    }


    // user wallet history with filter and pagination
    async userWalletHistory(userId: number, dto: UserWalletHistoryQueryDto) {
        // default values
        const page = dto.page || 1;
        const limit = dto.limit || 10;

        const skip = (page - 1) * limit;
        const take = limit;

        const where: any = { userId };

        if (dto.type) {
            where.transactionType = dto.type;
        }

        const [total, data] = await Promise.all([
            this.prisma.walletHistory.count({ where }),
            this.prisma.walletHistory.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' }, // latest first
            }),
        ]);

        return {
            total,
            page,
            limit,
            data,
        };
    }
   //
   async delete(id:number){
      const record = await this.prisma.walletHistory.findUnique({
             where:{
                   id
             }
       })
       if(!record){
           throw new NotFoundException("Record Not Found")
       }
       
        
        await this.prisma.walletHistory.delete({
             where:{
                   id
             }
       })
      
   }     



}
