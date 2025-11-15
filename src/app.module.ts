import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './core/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import Joi from 'joi';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,       // Config available globally
      envFilePath: '.env',  // Path to your .env file
      validationSchema: Joi.object({
      NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
      PORT: Joi.number().default(3000),
      DATABASE_URL: Joi.string().required(),
  }),
    }),
    UsersModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
  
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
