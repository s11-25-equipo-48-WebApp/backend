import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptionsWithRequest } from 'passport-jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthToken } from 'src/modules/auth/entities/authToken.entity';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
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

    // ======================================
    // 1. Buscar el token por payload.tokenId
    // ======================================
    const tokenInDb = await this.authTokenRepository.findOne({
      where: { id: payload.tokenId, revoked: false },
      relations: ['user'],
    });

    if (!tokenInDb) {
      throw new UnauthorizedException(
        'Refresh token inválido, revocado o no encontrado',
      );
    }

    // ======================================
    // 2. Comparar el token recibido con el hash
    // ======================================
    const isValid = await bcrypt.compare(
      refreshToken,
      tokenInDb.refresh_token_hash,
    );

    if (!isValid) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // ======================================
    // 3. Devolver usuario + el token usado
    // ======================================
    return {
      id: tokenInDb.user.id,
      email: tokenInDb.user.email,
      authToken: tokenInDb,
      organizations: payload.organizations ?? [],
    };
  }
}
