import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

    const opts = new DocumentBuilder()
      .setTitle('CMS API')
      .setDescription('Documentación API para el CMS')
      .setVersion('1.0')
      .addTag('cms')
      .build();

    const doc = SwaggerModule.createDocument(app, opts);
    SwaggerModule.setup('docs', app, doc);
  

  const port = configService.getOrThrow<number>('port');
  await app.listen(port);

}

bootstrap();

