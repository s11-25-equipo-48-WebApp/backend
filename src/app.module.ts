import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./modules/auth/auth.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { APP_FILTER } from "@nestjs/core";
import { LoggerModule } from "./infra/Logger/logger.module";
import { TypeOrmConfigService } from "./config/typeorm.config";
import { TestimoniosModule } from './modules/testimonios/testimonios.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TagsModule } from './modules/tags/tags.module';
import { OrganizationModule } from "./modules/organization/organization.module";
import { UserModule } from './modules/user/user.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { EmbedModule } from "./modules/embedb/embed.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: TypeOrmConfigService,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // ⬅️ La ruta a tu carpeta estática
      serveRoot: '/static', // ⬅️ El prefijo URL para acceder a los archivos estáticos (opcional)
    }),
    LoggerModule,
    AuthModule,
    TestimoniosModule,
    CategoriesModule,
    TagsModule,
    forwardRef(() => OrganizationModule),
    UserModule,
    AnalyticsModule,
    EmbedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule { }

