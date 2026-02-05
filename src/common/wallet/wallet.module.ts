import { Module } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { RaiderModule } from 'src/modules/raider_root/raider gateways/raider.module';
import { WebhookController } from './stripe.controller';
import { UsersModule } from 'src/modules/users_root/users/users.module';
import { QueueModule } from 'src/modules/queue/queue.module';


@Module({
    imports:[
        RaiderModule,
        UsersModule,
        QueueModule
    ],
    controllers: [WalletController, WebhookController],
    providers: [WalletService, PrismaService,],
    exports: [WalletService]
})
export class WalletModule { }
