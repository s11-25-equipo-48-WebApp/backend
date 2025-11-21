import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pino from 'pino';

@Injectable()
export class PinoLogger {
  private logger;

  constructor(private readonly configService: ConfigService) {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';

    this.logger = pino(
      !isProd
        ? {
            level: 'debug',
            transport: {
              target: 'pino-pretty',
              options: { colorize: true, singleLine: true },
            },
          }
        : { level: 'info' }
    );
  }

  log(message: string, ...meta: any[]) {
    this.logger.info({ msg: message, meta });
  }

  error(message: string, trace?: string, ...meta: any[]) {
    this.logger.error({ msg: message, trace, meta });
  }

  warn(message: string, ...meta: any[]) {
    this.logger.warn({ msg: message, meta });
  }

  debug(message: string, ...meta: any[]) {
    this.logger.debug({ msg: message, meta });
  }

  verbose(message: string, ...meta: any[]) {
    this.logger.info({ msg: message, meta });
  }
}
