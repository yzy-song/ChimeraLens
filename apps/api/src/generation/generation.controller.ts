// apps/api/src/generation/generation.controller.ts
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GenerationService } from './generation.service';
import { RequestWithUser } from 'src/auth/guest.middleware';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('generation')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    // <-- 直接使用
    return this.generationService.findAll(paginationDto);
  }

  @Post()
  @UseInterceptors(FileInterceptor('sourceImage'))
  async create(
    @Req() req: RequestWithUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
          new FileTypeValidator({ fileType: 'image' }),
        ],
      }),
    )
    sourceImage: Express.Multer.File,
    @Body('templateImageUrl') templateImageUrl: string,
    @Body('provider') provider: string = 'replicate', // replicate 或 'huggingface'，根据实际需求选择
  ) {
    return this.generationService.createGeneration(
      req.user,
      sourceImage,
      templateImageUrl,
      provider, // 这里可以根据需要选择 'replicate' 或 'huggingface'
      // modelId // 未来可以传入具体模型ID
    );
  }
}
