// apps/api/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppLogger } from './common/utils/logger';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';

import { join } from 'path';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // 1. 完全禁用 NestJS 内置的日志，由我们自己的 Winston Logger 全权接管
    logger: false,
    abortOnError: false,
  });
  // 2. 使用 Helmet 增强安全性
  app.use(helmet());
  // 3. 使用自定义的 AppLogger
  const logger = await app.resolve(AppLogger);
  app.useLogger(logger);

  // --- Swagger 配置 ---
  const config = new DocumentBuilder()
    .setTitle('美甲店预约系统 API')
    .setDescription('这是为美甲店预约系统提供后端服务的 API 文档')
    .setVersion('1.0')
    .addBearerAuth() // <-- 关键：启用 Bearer Token 授权
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // <-- 'api-docs' 是访问路径
  // --- Swagger 配置结束 ---

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // 4. 启用我们所有的全局管道、拦截器和过滤器
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 5. 配置 CORS，允许前端应用访问
  app.enableCors({
    origin: configService
      .get('CORS_ORIGINS')
      .split(',')
      .map((url) => url.trim()),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization, Accept',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // 6. 启用全局拦截器和过滤器
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter()); // 全局异常过滤器

  // 静态资源服务，提供 public 目录
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // 只对webhook路由使用 raw body
  app.use('/webhooks/stripe', bodyParser.raw({ type: 'application/json' }));
  // 7. 启动应用
  await app.listen(port, '0.0.0.0');

  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
});
