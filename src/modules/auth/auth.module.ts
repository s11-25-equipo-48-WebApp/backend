import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "src/jwt/jwt.strategy";
import { AuthController } from "./auth.controller";
import { JwtRefreshStrategy } from "src/jwt/JwtRefreshStrategy";
import { User } from "./entities/user.entity";
import { AuthToken } from "./entities/authToken.entity";
import { OrganizationUser } from "../organization/entities/organization_user.entity";
import { Organization } from "../organization/entities/organization.entity";

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), 
        signOptions: {
          expiresIn: '1d',
        },
      }),
    }),
    TypeOrmModule.forFeature([
      User, 
      AuthToken, 
      OrganizationUser,
      Organization,
    ]),
  ],
  providers: [
    AuthService, 
    JwtStrategy, 
    JwtRefreshStrategy,
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    JwtStrategy,
    PassportModule
  ],
})
export class AuthModule {}
