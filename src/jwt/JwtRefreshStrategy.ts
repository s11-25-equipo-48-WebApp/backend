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
    this.logger.log('[JWT REFRESH STRATEGY] Validando refresh token');
    this.logger.log('[JWT REFRESH STRATEGY] Cookies disponibles:', Object.keys(req.cookies || {}));
    
    const refreshToken =
      req.cookies && req.cookies['refresh-token']
        ? req.cookies['refresh-token']
        : null;

    if (!refreshToken) {
      this.logger.error('[JWT REFRESH STRATEGY] Refresh token no proporcionado en cookies');
      throw new UnauthorizedException('Refresh token no proporcionado');
    }
    
    this.logger.log('[JWT REFRESH STRATEGY] Refresh token encontrado en cookies');
    this.logger.log('[JWT REFRESH STRATEGY] Payload recibido:', JSON.stringify(payload));

    // ======================================
    // 1. Buscar el token por payload.tokenId
    // ======================================
    const tokenInDb = await this.authTokenRepository.findOne({
      where: { id: payload.tokenId, revoked: false },
      relations: ['user'],
    });

    if (!tokenInDb) {
      this.logger.error(`[JWT REFRESH STRATEGY] Token no encontrado en DB para tokenId: ${payload.tokenId}`);
      throw new UnauthorizedException(
        'Refresh token inválido, revocado o no encontrado',
      );
    }
    
    this.logger.log(`[JWT REFRESH STRATEGY] Token encontrado en DB para user: ${tokenInDb.user.id}`);

    // ======================================
    // 2. Comparar el token recibido con el hash
    // ======================================
    const isValid = await bcrypt.compare(
      refreshToken,
      tokenInDb.refresh_token_hash,
    );

    if (!isValid) {
      this.logger.error('[JWT REFRESH STRATEGY] Refresh token no coincide con el hash');
      throw new UnauthorizedException('Refresh token inválido');
    }
    
    this.logger.log('[JWT REFRESH STRATEGY] Token válido, retornando usuario');

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
