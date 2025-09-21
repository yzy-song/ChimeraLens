import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  Param,
  NotFoundException,
  Get,
  Query,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
  BadRequestException,
  StreamableFile,
  Res,
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
import { User } from 'src/auth/decorators/user.decorator';
import { User as UserModel } from '@chimeralens/db';
import { paginate } from 'src/common/utils/pagination.util';
import { Response } from 'express';

@ApiTags('图像生成')
@UseGuards(ThrottlerGuard)
@Controller('generations')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Get(':id')
  @ApiOperation({ summary: '获取单个生成作品的详情' })
  @ApiResponse({ status: 200, description: '返回作品详情' })
  @ApiCommonResponses()
  async findOneById(@Param('id') id: string) {
    const generation = await this.generationService.findOneById(id);
    if (!generation) {
      throw new NotFoundException(`Generation with ID ${id} not found.`);
    }
    return generation;
  }

  @Get()
  @ApiOperation({ summary: '获取当前用户的生成历史' })
  @ApiBearerAuth()
  @UseGuards(JwtOptionalGuard)
  async findAll(@User() user: RequestWithUser['user'], @Query() paginationDto: PaginationDto) {
    if (!user) {
      return paginate([], 0, paginationDto.page, paginationDto.limit);
    }
    return this.generationService.findAll(user.id, paginationDto);
  }

  @Post()
  @UseGuards(JwtOptionalGuard)
  @ApiOperation({ summary: '创建新的图像生成请求' })
  @ApiResponse({ status: 201, description: '图像生成请求已创建' })
  @ApiCommonResponses()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('sourceImage'))
  async create(
    @Req() req: RequestWithUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
          new FileTypeValidator({ fileType: 'image' }),
        ],
      }),
    )
    sourceImage: Express.Multer.File,
    @Body() createGenerationDto: CreateGenerationDto,
  ) {
    const user = req.user;
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    if (!createGenerationDto.templateId || !createGenerationDto.modelKey) {
      throw new BadRequestException('Missing required fields: templateId or modelKey.');
    }
    return this.generationService.createGeneration(
      user,
      sourceImage,
      createGenerationDto.templateId,
      createGenerationDto.modelKey,
      createGenerationDto.options,
    );
  }

  @Get(':id/download')
  @ApiOperation({ summary: '下载带有水印的图片' })
  @ApiResponse({ status: 200, description: '返回水印图片' })
  @ApiCommonResponses()
  @ApiBearerAuth()
  @UseGuards(JwtOptionalGuard)
  async download(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const fileBuffer = await this.generationService.downloadGeneration(id);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="chimeralens-${id}.png"`);
    res.send(fileBuffer);
  }
}
