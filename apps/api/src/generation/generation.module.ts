import { Module } from '@nestjs/common';
import { GenerationService } from './generation.service';
import { GenerationController } from './generation.controller';
import { ReplicateProvider } from './providers/replicate.provider';
import { HuggingFaceProvider } from './providers/huggingface.provider';
import { CacheModule } from '@nestjs/cache-manager';
@Module({
  controllers: [GenerationController],
  providers: [GenerationService, ReplicateProvider, HuggingFaceProvider], // <-- 在这里注册
})
export class GenerationModule {}
