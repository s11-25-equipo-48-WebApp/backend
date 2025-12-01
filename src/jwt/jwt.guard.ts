import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // ⬅️ NUEVO: detectar endpoints públicos
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.log(`[JwtAuthGuard] Endpoint público detectado, saltando autenticación`);
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    this.logger.log(`[JwtAuthGuard] Verificando autenticación para: ${request.method} ${request.url}`);
    this.logger.log(`[JwtAuthGuard] Authorization header: ${authHeader ? authHeader.substring(0, 20) + '...' : 'NO PRESENTE'}`);

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      this.logger.error(`[JwtAuthGuard] Error de autenticación: ${info?.message || err?.message || 'Usuario no encontrado'}`);
      throw err || new UnauthorizedException('Token inválido o no proporcionado');
    }

    this.logger.log(`[JwtAuthGuard] Usuario autenticado: ${user.id}`);
    return user;
  }
}

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
