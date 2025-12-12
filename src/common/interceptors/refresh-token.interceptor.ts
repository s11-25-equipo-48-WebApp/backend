import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenInterceptor implements NestInterceptor {
  constructor(private readonly configService: ConfigService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        //
        // 🔥 1. Verifica si existe refreshToken
        //
        if (!data?.refreshToken) {
          return data; // <- No rompe nada, deja pasar la respuesta
        }

        const refreshToken = data.refreshToken;

        //
        // 🔥 2. Obtener expiración desde configuración
        //
        const refreshTokenExpiresInDays = 7;

        const expires = new Date(
          Date.now() + refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
        );

        //
        // 🔥 3. Setear cookie HttpOnly + Secure
        //
        const isProd = this.configService.get<string>('NODE_ENV') === 'production';

        response.cookie('refresh-token', refreshToken, {
          httpOnly: true,
          secure: isProd,
          sameSite: 'strict',
          expires,
          path: '/',
        });

        //
        // 🔥 4. Quitar refreshToken del response (seguridad)
        //
        const { refreshToken: _, ...rest } = data;

        //
        // 🔥 5. Devolver la respuesta limpia
        //
        return rest;
      }),
    );
  }
}
