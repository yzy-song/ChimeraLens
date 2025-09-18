import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AppLogger } from '../utils/logger';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new AppLogger();

  constructor() {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // 提取更具体的错误信息
    let message: any = 'Internal server error';
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        // 兼容 class-validator 的错误格式
        message = (response as any).message || message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const stack = exception instanceof Error ? exception.stack : undefined;

    // 日志记录保持不变
    this.logger.error(
      `Exception: ${Array.isArray(message) ? JSON.stringify(message) : message}`,
      stack,
      `path: ${request.url}, method: ${request.method}, statusCode: ${status}, timestamp: ${new Date().toISOString()}`,
    );

    // 在返回给前端的 JSON 中包含 message
    response.status(status).json({
      statusCode: status,
      message: message, // <--- 核心改动在这里
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
