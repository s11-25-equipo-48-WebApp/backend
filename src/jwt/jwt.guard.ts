import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
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
