import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'; // <-- 导入
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { GuestMiddleware } from './auth/guest.middleware'; // <-- 导入

import { ConfigModule } from '@nestjs/config';
import { GenerationModule } from './generation/generation.module';
import { AuthModule } from './auth/auth.module';
import { TemplatesModule } from './templates/templates.module';
import { AppLogger } from './common/utils/logger';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, GenerationModule, AuthModule, TemplatesModule],
  controllers: [AppController],
  providers: [AppService, AppLogger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(GuestMiddleware).forRoutes('*');
  }
}
