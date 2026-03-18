import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startedAt = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => this.recordRequest(request, response.statusCode, startedAt),
        error: (error) => {
          const statusCode =
            typeof error?.getStatus === 'function' ? error.getStatus() : 500;

          this.recordRequest(request, statusCode, startedAt);
        },
      }),
    );
  }

  private recordRequest(request: any, statusCode: number, startedAt: bigint) {
    const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
    const method = request.method ?? 'UNKNOWN';
    const route = this.resolveRoute(request);

    this.metricsService.recordHttpRequest(method, route, statusCode, durationSeconds);
  }

  private resolveRoute(request: any) {
    const routePath = request?.route?.path;
    const baseUrl = request?.baseUrl ?? '';

    if (typeof routePath === 'string') {
      return `${baseUrl}${routePath}` || routePath;
    }

    return request?.path ?? request?.url ?? 'unknown';
  }
}
