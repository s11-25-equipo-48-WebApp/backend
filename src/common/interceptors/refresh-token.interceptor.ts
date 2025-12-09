import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenInterceptor implements NestInterceptor {
  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        const response = context.switchToHttp().getResponse<Response>();
        const isProd = this.configService.get('NODE_ENV') === 'production';

        if (data.refreshToken) {
          response.cookie('refresh-token', data.refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            path: '/',
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });
          // Remove refreshToken from the response body sent to the client
          const { refreshToken, ...result } = data;
          return result;
        }
        return data;
      }),
    );
  }
}
