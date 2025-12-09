import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { Logger } from '@nestjs/common';

@Injectable()
export class RefreshTokenInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RefreshTokenInterceptor.name);
  
  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        const response = context.switchToHttp().getResponse<Response>();
        const isProd = this.configService.get('NODE_ENV') === 'production';

        if (data.refreshToken) {
          this.logger.log('[REFRESH TOKEN INTERCEPTOR] Estableciendo cookie refresh-token');
          this.logger.log(`[REFRESH TOKEN INTERCEPTOR] isProd: ${isProd}`);
          
          response.cookie('refresh-token', data.refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            path: '/',
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });
          
          this.logger.log('[REFRESH TOKEN INTERCEPTOR] Cookie establecida correctamente');
          
          // Remove refreshToken from the response body sent to the client
          const { refreshToken, ...result } = data;
          return result;
        }
        
        this.logger.log('[REFRESH TOKEN INTERCEPTOR] No refreshToken en respuesta');
        return data;
      }),
    );
  }
}
