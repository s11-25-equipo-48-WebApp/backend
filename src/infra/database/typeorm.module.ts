import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    host: config.get<string>('database.host'),
    port: config.get<number>('database.port'),
    username: config.get<string>('database.username'),
    password: config.get<string>('database.password'),
    database: config.get<string>('database.name'),
    entities: [__dirname + '/../../modules/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../../infra/database/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: config.get<string>('nodeEnv') !== 'production',
  }),
});

