import { Controller, Get } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '@nestjs/swagger';
import { ApiCommonResponses } from 'src/common/decorators/api-common-responses.decorator';
@ApiTags('模板管理')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: '获取所有模板' })
  @ApiResponse({ status: 200, description: '返回所有模板' })
  @ApiCommonResponses()
  findAll() {
    return this.templatesService.findAll();
  }
}
