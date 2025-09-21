import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '@nestjs/swagger';
import { ApiCommonResponses } from 'src/common/decorators/api-common-responses.decorator';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@ApiTags('模板管理')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @UseInterceptors(CacheInterceptor) // <-- 1. 使用缓存拦截器
  @CacheTTL(3600 * 1000) // <-- 2. 设置缓存过期时间为 1 小时 (3600 秒)
  @ApiOperation({ summary: '获取所有模板' })
  @ApiResponse({ status: 200, description: '返回所有模板' })
  @ApiCommonResponses()
  findAll() {
    return this.templatesService.findAll();
  }
}
