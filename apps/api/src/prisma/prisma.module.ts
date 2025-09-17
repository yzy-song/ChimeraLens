import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // <-- 添加 @Global() 装饰器
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
