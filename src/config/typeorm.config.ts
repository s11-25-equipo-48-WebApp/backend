import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import ConfigEnvs from './envs';
//import ConfigEnvs from './Envs';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const nodeEnv = ConfigEnvs.NODE_ENV;
    const isProduction = nodeEnv === 'production';
    const dbUrl = ConfigEnvs.DATABASE_URL;

    return {
      type: 'postgres',
      url: dbUrl,
      synchronize: true,
      entities: [join(__dirname, '../**/*.entity.{ts,js}')],
      migrations: [join(__dirname, '/../migrations/*.{ts,js}')],
      logging: !isProduction,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      logger:'debug',
      migrationsRun: true,
    };
  }
}