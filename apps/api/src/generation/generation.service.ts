import { MODELS } from './models.config';
import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@chimeralens/db';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { ReplicateProvider } from './providers/replicate.provider';

import { TEMPLATES_DATA } from '../templates/templates.data';
import { NotFoundException } from '@nestjs/common';
import { paginate } from 'src/common/utils/pagination.util';
import { PaginationDto } from 'src/common/dto/pagination.dto';
@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    // 我们现在只注入 ReplicateProvider
    private readonly replicateProvider: ReplicateProvider,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  // 上传用户本地图片 Buffer
  private async uploadImageFromBuffer(fileBuffer: Buffer): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'image',
            folder: 'chimeralens/user_uploads',
          },
          (error, result) => {
            if (error) return reject(new Error(error.message || String(error)));
            if (!result) return reject(new Error('Cloudinary upload failed.'));
            resolve(result);
          },
        )
        .end(fileBuffer);
    });
  }

  /**
   * 从一个远程 URL 上传图片到 Cloudinary (用于转存 Replicate 的结果只有1小时有效期)
   * @param imageUrl - 来源图片 URL (例如 Replicate 的临时 URL)
   * @returns Cloudinary 的上传结果
   */
  private async uploadImageFromUrl(imageUrl: string): Promise<UploadApiResponse> {
    try {
      this.logger.log(`Transferring image from URL to Cloudinary: ${imageUrl}`);
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: 'chimeralens/results', // 我们为最终结果创建一个新的文件夹
      });
      this.logger.log('Image transferred to Cloudinary successfully.');
      return result;
    } catch (error) {
      this.logger.error('Failed to transfer image from URL to Cloudinary', error);
      throw new Error('Failed to save the generated image.');
    }
  }

  async createGeneration(
    user: User,
    sourceImage: Express.Multer.File,
    templateId: string,
    modelKey: string,
    options?: Record<string, any>,
  ) {
    const template = TEMPLATES_DATA.find((t) => t.id === templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // 2. 检查模板是否为高级以及用户是否为游客
    if (template.isPremium && user.isGuest) {
      throw new ForbiddenException('This is a premium template. Please log in or register to use it.');
    }

    if (user.credits <= 0) {
      throw new ForbiddenException('Insufficient credits');
    }

    // 从配置文件中查找模型;
    const modelConfig = MODELS[modelKey];
    if (!modelConfig) {
      throw new Error(`Model with key '${modelKey}' not found.`);
    }
    // 1. 上传用户原图
    const sourceImageUrl = (await this.uploadImageFromBuffer(sourceImage.buffer)).secure_url;

    const modelInput = modelConfig.formatInput({ templateImageUrl: template.imageUrl, sourceImageUrl }, options);
    const modelId = modelConfig.id;

    this.logger.log('--- Sending to Replicate ---');
    this.logger.log('Model ID:', modelId);
    this.logger.log('Model Input:', modelInput);

    // 2. 调用 Replicate 模型
    const replicateOutput = await this.replicateProvider.run({
      model: modelId,
      input: modelInput,
    });

    const temporaryResultUrl = Array.isArray(replicateOutput) ? replicateOutput[0] : replicateOutput;

    if (!temporaryResultUrl || typeof temporaryResultUrl !== 'string') {
      this.logger.error('Could not parse a valid URL from Replicate output', replicateOutput);
      throw new Error('AI generation failed to return a valid image URL.');
    }

    // 👇 --- 核心逻辑变化 --- 👇
    // 3. 将 Replicate 的临时结果图转存到我们自己的 Cloudinary
    const finalImage = await this.uploadImageFromUrl(temporaryResultUrl);
    const resultImageUrl = finalImage.secure_url; // <-- 这是我们永久的、自己的 URL

    // 4. 将我们自己的永久 URL 存入数据库
    const [updatedUser, newGeneration] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 1 } },
      }),
      this.prisma.generation.create({
        data: {
          userId: user.id,
          sourceImageUrl,
          templateImageUrl: template.imageUrl,
          resultImageUrl, // <-- 保存的是永久的 Cloudinary URL
        },
      }),
    ]);

    return {
      resultImageUrl: newGeneration.resultImageUrl,
      credits: updatedUser.credits,
    };
  }

  async findAll(userId: string, paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const whereClause = { userId: userId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.generation.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.generation.count({
        where: whereClause,
      }),
    ]);

    return paginate(items, total, page, limit);
  }

  async findOneById(id: string) {
    this.logger.log(`Fetching generation by ID: ${id}`);
    return this.prisma.generation.findUnique({
      where: { id },
    });
  }
}
