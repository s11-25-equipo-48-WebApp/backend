import { Injectable } from '@nestjs/common';
import pino from 'pino';

@Injectable()
export class PinoLogger {
  private logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: { colorize: true },
        }
      : undefined,
  });

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
