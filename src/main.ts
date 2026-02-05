import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { version, name } from 'package.json';
import { join } from 'path';
import * as express from 'express'; // Changed to * as express for better compatibility
import { SocketIOAdapter } from './adapters/socket-io.adapter';

async function bootstrap() {
const app = await NestFactory.create(AppModule, {
    rawBody: true, 
  });

  // Global prefix
  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);
  
  // Use the custom Socket.IO adapter
  app.useWebSocketAdapter(new SocketIOAdapter(app));

  // CORS
  app.enableCors({
    origin: [
      'https://admin.zipbee.sg',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5500',
      'https://nongregarious-tayna-lipochromic.ngrok-free.dev', 
    ],
    credentials: true,
  });

  // Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ENV config
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
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
  
  // You can keep these for static files
  app.use('/', express.static(publicDir));
  app.use('/uploads', express.static(uploadDir));

  await app.listen(port, host);
  
  console.log(`✅ Server running on: http://localhost:${port}`);
  console.log(`✅ Swagger docs: http://localhost:${port}/${globalPrefix}/docs`);
  console.log(`✅ Webhook endpoint: http://localhost:${port}/${globalPrefix}/webhooks/stripe`);
}

bootstrap();