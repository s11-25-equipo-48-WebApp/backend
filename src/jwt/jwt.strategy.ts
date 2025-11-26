import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/modules/auth/entities/enums';
import { OrganizationUser } from 'src/modules/organization/entities/organization_user.entity';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(OrganizationUser)
    private readonly organizationUserRepository: Repository<OrganizationUser>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);

    console.log('[JwtStrategy] Strategy inicializada');
  }

  async validate(req: Request, payload: any) {
    console.log(`[JwtStrategy] Validando token con payload: ${JSON.stringify(payload)}`);

    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    console.log(
      `[JwtStrategy] Access token recibido: ${token ? token.substring(0, 10) + '...' : 'No token'
      }`,
    );

    if (!payload) {
      console.log('[JwtStrategy] Payload vacío.');
      throw new UnauthorizedException('Token inválido');
    }

    console.log(`[JwtStrategy] Token válido para usuario ${payload.sub}`);


    return {
      id: payload.sub,
      email: payload.email,
      organization: payload.organization || undefined,
    };
  }
}
