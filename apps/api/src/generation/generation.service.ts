import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@chimeralens/db';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';

import Replicate from 'replicate';

@Injectable()
export class GenerationService {
  private replicate: Replicate;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
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
  ) {
    // 1. 检查用户点数
    if (user.credits <= 0) {
      throw new ForbiddenException('Insufficient credits');
    }

    // 2. 上传源图片到 Cloudinary
    const uploadResult = await this.uploadImage(sourceImage.buffer);
    const sourceImageUrl = uploadResult.secure_url;

    // 3. 调用 Replicate AI 模型
    console.log('Running Replicate model...');
    const output = await this.replicate.run(
      // 这是一个常用的换脸模型，你也可以在 Replicate 网站上寻找其他模型
      'cdingram/face-swap:d1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111',
      {
        input: {
          face: sourceImageUrl, // 你的脸
          target: templateImageUrl, // 模板图
        },
      },
    );
    console.log('Replicate model finished.', output);
    const resultImageUrl =
      typeof output === 'string' ? output : (output as unknown as string);

    if (!resultImageUrl) {
      throw new Error('AI generation failed.');
    }

    // 4. 使用数据库事务：扣除点数并记录生成历史
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
