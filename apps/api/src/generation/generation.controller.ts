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

import { JwtOptionalGuard } from 'src/auth/guards/jwt-optional.guard';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/auth/decorators/user.decorator';
import { User as UserModel } from '@chimeralens/db';
import { paginate } from 'src/common/utils/pagination.util';

@ApiTags('图像生成')
@UseGuards(ThrottlerGuard) // 应用速率限制守卫
@Controller('generations')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Get()
  @ApiOperation({ summary: '获取当前用户的生成历史' })
  @ApiBearerAuth()
  @UseGuards(JwtOptionalGuard)
  findAll(@User() user: UserModel, @Query() paginationDto: PaginationDto) {
    if (!user) {
      // 如果既没有 guest-id 也没有 token，则返回空列表
      return paginate([], 0, paginationDto.page, paginationDto.limit);
    }
    return this.generationService.findAll(user.id, paginationDto);
  }

  @Post()
  @UseGuards(JwtOptionalGuard)
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
      createGenerationDto.templateId,
      createGenerationDto.modelKey,
      createGenerationDto.options,
    );
  }
}
