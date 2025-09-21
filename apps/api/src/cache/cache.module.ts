import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('CHIMERALENS_REDIS_URL');

        if (!redisUrl) {
          console.warn('CHIMERALENS_REDIS_URL not found, using in-memory cache.');
          return { ttl: 60 }; // 60 秒
        }

        const store = await redisStore({
          url: redisUrl,
          ttl: 60, // 60 秒
        });

        return {
          store,
          ttl: 60,
        };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
