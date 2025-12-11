import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptionsWithRequest } from 'passport-jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/modules/auth/entities/user.entity';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private readonly logger = new Logger(JwtRefreshStrategy.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
    this.logger.log('[JWT REFRESH STRATEGY] Payload recibido:', JSON.stringify(payload));

    // ======================================
    // VALIDACIÓN SIMPLIFICADA:
    // Solo verificar que el usuario exista y esté activo
    // El JWT ya fue verificado por Passport (firma + expiración)
    // ======================================
    
    const userId = payload.sub || payload.userId;
    
    if (!userId) {
      this.logger.error('[JWT REFRESH STRATEGY] No se encontró userId en el payload');
      throw new UnauthorizedException('Token inválido');
    }

    const user = await this.userRepository.findOne({
      where: { 
        id: userId,
        is_active: true 
      },
    });

    if (!user) {
      this.logger.error(`[JWT REFRESH STRATEGY] Usuario no encontrado o inactivo: ${userId}`);
      throw new UnauthorizedException('Usuario no válido');
    }
    
    this.logger.log(`[JWT REFRESH STRATEGY] Usuario validado exitosamente: ${user.id}`);

    // ======================================
    // Retornar usuario validado
    // ======================================
    return {
      id: user.id,
      email: user.email,
      organizations: payload.organizations ?? [],
    };
  }
}
