import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Organization } from "./entities/organization.entity";
import { OrganizationUser } from "./entities/organization_user.entity";
import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";
import { User } from "../auth/entities/user.entity";
import { AuthToken } from "../auth/entities/authToken.entity";

@Module({
    imports: [
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
        TypeOrmModule.forFeature([Organization, OrganizationUser, User, AuthToken]),
        forwardRef(() => AuthModule),
    ],
    controllers: [OrganizationController],
    providers: [OrganizationService],
    exports: [OrganizationService, TypeOrmModule.forFeature([Organization, OrganizationUser, User, AuthToken])],
})
export class OrganizationModule {
  static forFeature(arg0: (typeof Organization)[]): import("@nestjs/common").Type<any> | import("@nestjs/common").DynamicModule | Promise<import("@nestjs/common").DynamicModule> | import("@nestjs/common").ForwardReference<any> {
    throw new Error('Method not implemented.');
  }
}
