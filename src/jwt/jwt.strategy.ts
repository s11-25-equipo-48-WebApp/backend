import { Injectable, UnauthorizedException } from '@nestjs/common'; // Eliminar Logger
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../common/entities/enums';
import ConfigEnvs from '../config/envs';
import { Request } from 'express';


const jwtSecret = ConfigEnvs.JWT_SECRET;
if (!jwtSecret) {
  console.log('ERROR: JWT_SECRET must be defined in .env'); // Usar console.log
  throw new Error('JWT_SECRET must be defined in .env');
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  // private readonly logger = new Logger(JwtStrategy.name); // Eliminar Logger

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret as string,
      passReqToCallback: true, // Permite acceder al objeto request en validate
    });
    console.log('[JwtStrategy] JwtStrategy inicializada'); // console.log de inicialización
  }

  async validate(req: Request, payload: any) {
    console.log(`[JwtStrategy] Validando access token para payload: ${JSON.stringify(payload)}`); // Usar console.log
    
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    console.log(`[JwtStrategy] Access token recibido: ${token ? token.substring(0, 10) + '...' : 'No token'}`); // Usar console.log

    if (!payload) {
      console.log('[JwtStrategy] Payload vacío después de la validación del token.'); // Usar console.log
      throw new UnauthorizedException('Token de acceso inválido');
    }
    
    console.log(`[JwtStrategy] Access token validado exitosamente para el usuario: ${payload.sub}`); // Usar console.log
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role as Role,
    };
  }
}
