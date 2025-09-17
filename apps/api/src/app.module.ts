import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'; // <-- 导入
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { GuestMiddleware } from './auth/guest.middleware'; // <-- 导入

import { ConfigModule } from '@nestjs/config';
import { GenerationModule } from './generation/generation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    GenerationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  // <-- 实现 NestModule
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GuestMiddleware) // <-- 应用我们的中间件
      .forRoutes('*'); // <-- 应用于所有路由
  }
}
