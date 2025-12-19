import { Module } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';


@Module({
    controllers: [WalletController],
    providers: [WalletService, PrismaService],
})
export class WalletModule { }
