import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { APP_FILTER } from "@nestjs/core";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";
import { LoggerModule } from "./infra/Logger/logger.module";
import { TypeOrmConfigService } from "./config/typeorm.config";
import { TestingModule } from "./testing/testing.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: TypeOrmConfigService,
    }),
    LoggerModule,
    AuthModule,
    TestingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    TypeOrmConfigService,
  ],
})
export class AppModule {}
