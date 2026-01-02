import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { version, name } from 'package.json';
import { join } from 'path';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  });

  // Global prefix
  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);

  // Validation Pipe (only once)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ENV config
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 5000;
  const host = configService.get<string>('HOST') ?? '0.0.0.0';

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle(name)
    .setDescription('API documentation for the project')
    .setVersion(version)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup(`${globalPrefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Static folders
  const publicDir = join(process.cwd(), 'public');
  const uploadDir = join(process.cwd(), 'uploads');

  app.use('/', express.static(publicDir));
  app.use('/uploads', express.static(uploadDir));

  await app.listen(port, host);

  console.log(`✔ Swagger docs: http://localhost:${port}/${globalPrefix}/docs`);
}

bootstrap();

// check if owner ship   // sls -l prisma/migrations
// change the owner ship // sudo chown -R $(whoami):$(whoami) prisma/migrations
