import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthToken } from '../auth/entities/authToken.entity';
import { OrganizationUser } from '../organization/entities/organization_user.entity';
import { Organization } from '../organization/entities/organization.entity';
import { Testimonio } from '../testimonios/entities/testimonio.entity';
import { AppService } from 'src/app.service';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from 'src/common/filters/http-exception.filter';
import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../auth/entities/userProfile.entity';
import { AuthModule } from '../auth/auth.module';
import { TestimonioRolesGuard } from 'src/common/guards/testimonio-roles.guard';

@Module({
  imports: [
    ConfigModule,
    AuthModule, // Importar AuthModule para obtener PassportModule y JwtModule
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      AuthToken,
      Organization,
      OrganizationUser,
      Testimonio,
    ]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    AppService,
    TestimonioRolesGuard,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class UserModule { }
