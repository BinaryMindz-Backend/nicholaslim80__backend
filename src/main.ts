import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {version, name} from "package.json"

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global prefix for all routes
  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);

  // Config service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  const host = configService.get<string>('HOST') ?? '0.0.0.0';

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle(name)
    .setDescription('API documentation for the project')
    .setVersion(version)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Make Swagger respect the global prefix
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  // Start the app
  await app.listen(port, host);
  console.log(`Application is running on: http://${host}:${port}/${globalPrefix}`);
  console.log(`Swagger docs available at: http://${host}:${port}/${globalPrefix}/docs`);
}

bootstrap();
