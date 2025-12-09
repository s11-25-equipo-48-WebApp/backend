import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from '../../infra/Logger/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // Protección para evitar ERR_HTTP_HEADERS_SENT
    if (res.headersSent) {
      this.logger.error(
        'Headers already sent, skipping response. Exception: ' + JSON.stringify(exception)
      );
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorResponse: any = exception;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorResponse = exception.getResponse(); // Get the actual error response from HttpException
      message = typeof errorResponse === 'string' ? errorResponse : (errorResponse as any).message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const payload = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req.url,
      message,
    };

    this.logger.error(
      'Caught exception: ' + JSON.stringify({ exception: errorResponse, payload })
    );

    // Using res.send() and then explicitly ending the response to prevent further processing
    // and resolve "Headers already sent" and subsequent 404 errors.
    res.status(status).send(payload);
  }
}
