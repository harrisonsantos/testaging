import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const timestamp = new Date().toISOString();

    const errorResponse = isHttpException
      ? exception.getResponse()
      : { message: 'Internal server error' };

    const message = (errorResponse as any)?.message || (exception as any)?.message || 'Unexpected error';

    this.logger.error({
      statusCode: status,
      method: request.method,
      path: request.url,
      message,
      timestamp,
      userAgent: request.headers?.['user-agent'],
      ip: request.ip,
    });

    response.status(status).json({
      statusCode: status,
      timestamp,
      path: request.url,
      message,
    });
  }
}


