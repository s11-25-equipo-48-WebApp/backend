import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly config: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return this.buildOptions();
  }

  createDataSourceOptions?(): TypeOrmModuleOptions {
    return this.buildOptions();
  }

  private buildOptions(): TypeOrmModuleOptions {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const dbUrl = this.config.get<string>('DATABASE_URL');
    console.log('⚠️ DATABASE_URL:', dbUrl);
    if (!dbUrl) {
      console.error('❌ ERROR: DATABASE_URL no definida');
      throw new Error('DATABASE_URL no definida');
    }

    const options: TypeOrmModuleOptions = {
      type: 'postgres',
      url: dbUrl,
      synchronize: true,              
      autoLoadEntities: true,
      logging: !isProd,               
      ssl: isProd ? { rejectUnauthorized: false } : false,
      migrationsRun: true,
      migrations: [
        __dirname.includes('dist')
          ? join(__dirname, '../migrations/*.js')
          : join(process.cwd(), 'src/migrations/*.ts'),
      ],
      entities: [
        __dirname.includes('dist')
          ? join(__dirname, '../**/*.entity.js')
          : join(process.cwd(), 'src/**/*.entity.ts'),
      ]
    };

    if (!isProd) {
      console.log('📦 TypeORM config:', options);
    }

    return options;
  }
}
