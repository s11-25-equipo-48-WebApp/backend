import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import ConfigEnvs from './config/envs';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser'; // Corregir la importación de cookie-parser

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser()); // Usar el middleware cookie-parser
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // requiere class-transformer
    }),
  );

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const opts = new DocumentBuilder()
  .setTitle('CMS API')
  .setDescription('Documentación API para el CMS')
  .setVersion('1.0')
  .addTag('cms')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
    'access-token',
  )
  .build();

  const doc = SwaggerModule.createDocument(app, opts);
  SwaggerModule.setup('docs', app, doc);


  const port = ConfigEnvs.PORT;
  await app.listen(port);

}

bootstrap();
