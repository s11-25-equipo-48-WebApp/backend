import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptionsWithRequest } from 'passport-jwt';
import { Role } from 'src/common/entities/enums';
import { AuthToken } from 'src/common/entities/authToken.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  private readonly logger = new Logger(JwtRefreshStrategy.name);

  constructor(
    @InjectRepository(AuthToken)
    private readonly authTokenRepository: Repository<AuthToken>,

    private readonly configService: ConfigService, 
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies?.['refresh-token'] ?? null,
      ]),
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  async validate(req: Request, payload: any) {
    const refreshToken =
      req.cookies && req.cookies['refresh-token']
        ? req.cookies['refresh-token']
        : null;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token no proporcionado');
    }

    const tokenInDb = await this.authTokenRepository.findOne({
      where: { user: { id: payload.sub }, revoked: false },
    });

    if (!tokenInDb) {
      throw new UnauthorizedException('Refresh token inválido o revocado');
    }

    const isValid = await bcrypt.compare(
      refreshToken,
      tokenInDb.refresh_token_hash,
    );

    if (!isValid) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role as Role,
      authToken: tokenInDb,
    };
  }
}
