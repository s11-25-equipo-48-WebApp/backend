import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { useContainer } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log('[MAIN] App bootstrap iniciada');

  const configService = app.get(ConfigService);

  app.use(cookieParser());

  // Validations
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // GLOBAL PREFIX
  app.setGlobalPrefix('api/v1');

  const whitelist = [
    '*',
    'http://localhost:3000',
    'https://cms-testimonials.vercel.app',
  ];

  app.enableCors({
    origin: (origin, callback) => {

      if (!origin) return callback(null, true);
      callback(null, true);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });


  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // -------- SWAGGER CONFIG --------
  const opts = new DocumentBuilder()
    .setTitle('CMS API')
    .setDescription('Documentación API para el CMS')
    .setVersion('1.0')
    .addTag('cms')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const doc = SwaggerModule.createDocument(app, opts, {
    ignoreGlobalPrefix: false,
  });

  SwaggerModule.setup('docs', app, doc);

  const port = configService.get<number>('PORT') || 3002;

  await app.listen(port);
  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
