import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'; // <-- 导入
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { GuestMiddleware } from './auth/guest.middleware'; // <-- 导入

import { ConfigModule } from '@nestjs/config';
import { GenerationModule } from './generation/generation.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TemplatesModule } from './templates/templates.module';

import { FirebaseAdminModule } from './common/firebase/firebase-admin.module';
import { AppLogger } from './common/utils/logger';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'; // <-- 1. 导入
import { APP_GUARD } from '@nestjs/core';
import { BillingModule } from './billing/billing.module';
import { EmailModule } from './email/email.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 窗口时间，单位：毫秒 (这里是 60 秒)
        limit: 20, // 在一个窗口时间内，同一个 IP 最多允许 20 次请求
      },
    ]),
    PrismaModule,
    GenerationModule,
    AuthModule,
    TemplatesModule,
    UsersModule,
    FirebaseAdminModule,
    AuthModule,
    BillingModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppLogger,
    // 将 ThrottlerGuard 设置为全局守卫
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(GuestMiddleware).forRoutes('*');
  }
}
