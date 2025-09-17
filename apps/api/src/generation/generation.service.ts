import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@chimeralens/db';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';

import { ReplicateProvider } from './providers/replicate.provider';
import { HuggingFaceProvider } from './providers/huggingface.provider';
import Replicate from 'replicate';

@Injectable()
export class GenerationService {
  private replicate: Replicate;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly replicateProvider: ReplicateProvider,
    private readonly huggingFaceProvider: HuggingFaceProvider,
  ) {
    // 配置 Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });

    // 初始化 Replicate 客户端
    this.replicate = new Replicate({
      auth: this.configService.get<string>('REPLICATE_API_TOKEN'),
    });
  }

  // 将 Buffer 上传到 Cloudinary
  private async uploadImage(fileBuffer: Buffer): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ resource_type: 'image' }, (error, result) => {
          if (error) return reject(new Error(error.message || String(error)));
          resolve(result);
        })
        .end(fileBuffer);
    });
  }

  async createGeneration(
    user: User,
    sourceImage: Express.Multer.File,
    templateImageUrl: string,
    provider: string,
    // 将来我们可以传入模型ID来选择不同的模型
    // modelId: string
  ) {
    if (user.credits <= 0) {
      throw new ForbiddenException('Insufficient credits');
    }

    const sourceImageUrl = (await this.uploadImage(sourceImage.buffer))
      .secure_url;

    // 1. 定义要使用的模型和输入
    const modelId =
      'cdingram/face-swap:d1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111';
    const modelInput = {
      target_image: templateImageUrl,
      swap_image: sourceImageUrl,
    };

    // 2. 调用 Replicate 或者 HuggingFace Provider
    let output;
    console.log('Using provider:', provider);
    if (provider === 'replicate') {
      output = await this.replicateProvider.run({
        model: modelId,
        input: modelInput,
      });
    } else if (provider === 'huggingface') {
      output = await this.huggingFaceProvider.run({
        model: modelId,
        input: modelInput,
      });
    } else {
      throw new Error('Unsupported AI provider.');
    }
    const resultImageUrl = Array.isArray(output) ? output[0] : output;

    if (!resultImageUrl) {
      throw new Error('AI generation failed.');
    }

    const [updatedUser, newGeneration] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 1 } },
      }),
      this.prisma.generation.create({
        data: {
          userId: user.id,
          sourceImageUrl,
          templateImageUrl,
          resultImageUrl,
        },
      }),
    ]);

    return {
      resultImageUrl: newGeneration.resultImageUrl,
      credits: updatedUser.credits,
    };
  }
}
