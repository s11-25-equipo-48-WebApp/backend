import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import ConfigEnvs from 'src/config/envs';
import { Role } from 'src/common/entities/enums';
import { AuthToken } from 'src/common/entities/authToken.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Request } from 'express'; // Importar Request de express

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    @InjectRepository(AuthToken)
    private readonly authTokenRepository: Repository<AuthToken>,
  ) {
    super({
      // Extrae el refresh token de una cookie llamada 'refresh-token'
      jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => {
        const refreshToken = req.cookies && req.cookies['refresh-token'] ? req.cookies['refresh-token'] : null;
        this.logger.debug(`Refresh token extraído de cookie: ${refreshToken ? 'Sí' : 'No'}`);
        return refreshToken;
      }]),
      secretOrKey: ConfigEnvs.JWT_REFRESH_SECRET,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
    this.logger = new Logger(JwtRefreshStrategy.name);
  }
  private readonly logger: Logger;

  async validate(req: Request, payload: any) {
    this.logger.debug(`Validando refresh token para el usuario: ${payload.sub}`);
    this.logger.debug(`Cookies recibidas: ${JSON.stringify(req.cookies)}`); // Log para depuración de cookies
    // El refresh token ya ha sido extraído por jwtFromRequest del cookie
    const refreshToken = req.cookies && req.cookies['refresh-token'] ? req.cookies['refresh-token'] : null;

    if (!refreshToken) {
      this.logger.warn('Refresh token no proporcionado en la cookie de la solicitud');
      throw new UnauthorizedException('Refresh token no proporcionado');
    }

    const tokenInDb = await this.authTokenRepository.findOne({
      where: { user: { id: payload.sub }, revoked: false },
    });

    if (!tokenInDb) {
      this.logger.warn(`No se encontró un refresh token válido en DB para el usuario: ${payload.sub}`);
      throw new UnauthorizedException('Refresh token inválido o revocado');
    }

    const isValid = await bcrypt.compare(refreshToken, tokenInDb.refresh_token_hash);
    if (!isValid) {
      this.logger.warn(`Refresh token proporcionado no coincide con el hash en DB para el usuario: ${payload.sub}`);
      throw new UnauthorizedException('Refresh token inválido');
    }

    this.logger.debug(`Refresh token validado exitosamente para el usuario: ${payload.sub}`);
    return { id: payload.sub, email: payload.email, role: payload.role as Role, authToken: tokenInDb };
  }
}
