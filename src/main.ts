import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { useContainer } from 'class-validator';
import { PinoLogger } from './infra/Logger/logger.service';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { GlobalResponseInterceptor } from './common/interceptors/response.interceptor';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  console.log('[MAIN] App bootstrap iniciada');

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3002;

  // ------------ COOKIE PARSER ------------
  app.use(cookieParser());

  // ------------ VALIDATION PIPE ------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ------------ GLOBAL PREFIX ------------
  app.setGlobalPrefix('api/v1');

  // ------------ CORS ------------
  const whitelist = [
    'https://cms-testimonials.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    '*',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (whitelist.includes(origin) || whitelist.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ------------ CLASS-VALIDATOR DI (required for custom validators) ------------
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // ------------ EXCEPTION FILTER GLOBAL (AQUÍ VA) ------------
  const logger = app.get(PinoLogger);
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalInterceptors(new GlobalResponseInterceptor());

  // ------------ SWAGGER ------------
  const opts = new DocumentBuilder()
    .addCookieAuth()
    .setVersion('1.0')
    .setTitle('CMS API')
    .setDescription('Documentación API para el CMS')
    .setBasePath('api/v1')
    .addServer('http://localhost:3002')
    .addServer('https://backend-jnqc.onrender.com')
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

  // ------------ START SERVER ------------
  app.useStaticAssets(join(__dirname, '..', 'public', 'static'), {
    prefix: '/static/',
  });

  await app.listen(port);
  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
