import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const startedAt = Date.now();

    this.logger.log(`Incoming request: ${method} ${url}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsed = Date.now() - startedAt;
          this.logger.log(`Handled request: ${method} ${url} - ${elapsed}ms`);
        },
        error: (err) => {
          const elapsed = Date.now() - startedAt;
          this.logger.error(`Error handling request: ${method} ${url} - ${elapsed}ms`, err?.stack);
        },
      }),
    );
  }
}


