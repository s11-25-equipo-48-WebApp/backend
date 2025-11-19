import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../common/entities/user.entity";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "src/jwt/jwt.strategy";
import { AuthController } from "./auth.controller";
import { AuthToken } from "src/common/entities/authToken.entity";
import { JwtRefreshStrategy } from "src/jwt/JwtRefreshStrategy"; // Importar JwtRefreshStrategy
import ConfigEnvs from "src/config/envs";


@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    secret: ConfigEnvs.JWT_SECRET,
  }),
}),
    TypeOrmModule.forFeature([User, AuthToken]),
  ],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  controllers: [AuthController],
  exports: [AuthService] // Solo exportamos AuthService
})
export class AuthModule {}
