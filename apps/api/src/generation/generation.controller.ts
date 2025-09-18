import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  Get,
  Query,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GenerationService } from './generation.service';
import { RequestWithUser } from 'src/auth/guest.middleware';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { CreateGenerationDto } from './dto/create-generation.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiCommonResponses } from 'src/common/decorators/api-common-responses.decorator';

@ApiTags('图像生成')
@ApiBearerAuth() // 表明需要 Bearer Token 认证
@UseGuards(ThrottlerGuard) // 应用速率限制守卫
@Controller('generation')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Get()
  @ApiOperation({ summary: '获取生成记录列表' })
  @ApiResponse({ status: 200, description: '返回生成记录列表' })
  @ApiCommonResponses()
  findAll(@Query() paginationDto: PaginationDto) {
    // <-- 直接使用
    return this.generationService.findAll(paginationDto);
  }

  @Post()
  @ApiOperation({ summary: '创建新的图像生成请求' })
  @ApiResponse({ status: 201, description: '图像生成请求已创建' })
  @ApiCommonResponses()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 覆盖默认值：60秒内最多请求 5 次
  @UseInterceptors(FileInterceptor('sourceImage'))
  async create(
    @Req() req: RequestWithUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB
          new FileTypeValidator({ fileType: 'image' }),
        ],
      }),
    )
    sourceImage: Express.Multer.File,
    @Body() createGenerationDto: CreateGenerationDto,
  ) {
    if (!req.user) {
      throw new Error('User not found...');
    }
    return this.generationService.createGeneration(
      req.user,
      sourceImage,
      createGenerationDto.templateImageUrl,
      createGenerationDto.modelKey,
    );
  }
}
