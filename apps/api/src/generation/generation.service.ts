import { MODELS } from './models.config';
import { Injectable, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
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
    private readonly replicateProvider: ReplicateProvider,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Optimizes a Cloudinary URL by adding f_auto and q_auto transformations.
   * @param url The original Cloudinary URL.
   * @returns The optimized URL for web delivery.
   */
  private optimizeCloudinaryUrl(url: string): string {
    if (!url || !url.includes('/upload/')) {
      return url;
    }
    const parts = url.split('/upload/');
    // Inserts f_auto (auto format) and q_auto (auto quality)
    const optimizedUrl = `${parts[0]}/upload/f_auto,q_auto/${parts[1]}`;
    this.logger.log(`Optimizing Cloudinary URL: ${url} -> ${optimizedUrl}`);
    return optimizedUrl;
  }

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

  private async uploadImageFromUrl(imageUrl: string): Promise<UploadApiResponse> {
    try {
      this.logger.log(`Transferring image from URL to Cloudinary: ${imageUrl}`);
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: 'chimeralens/results',
      });
      this.logger.log('Image transferred to Cloudinary successfully.');
      return result;
    } catch (error) {
      this.logger.error('Failed to transfer image from URL to Cloudinary', error);
      throw new Error('Failed to save the generated image.');
    }
  }

  async createGeneration(
    user: Omit<User, 'password'> & { hasPassword: boolean },

    sourceImage: Express.Multer.File,
    templateId: string,
    modelKey: string,
    options?: Record<string, any>,
  ) {
    const template = TEMPLATES_DATA.find((t) => t.id === templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.isPremium && user.isGuest) {
      throw new ForbiddenException('This is a premium template. Please log in or register to use it.');
    }

    if (user.credits <= 0) {
      throw new ForbiddenException('Insufficient credits');
    }

    const modelConfig = MODELS[modelKey];
    if (!modelConfig) {
      throw new Error(`Model with key '${modelKey}' not found.`);
    }

    // Upload source image and get its URL
    const sourceUploadResult = await this.uploadImageFromBuffer(sourceImage.buffer);
    const sourceImageUrl = this.optimizeCloudinaryUrl(sourceUploadResult.secure_url);

    const modelInput = modelConfig.formatInput(
      { templateImageUrl: template.imageUrl, sourceImageUrl: sourceUploadResult.secure_url },
      options,
    );
    const modelId = modelConfig.id;

    this.logger.log('--- Sending to Replicate ---');
    this.logger.log('Model ID:', modelId);
    this.logger.log('Model Input:', modelInput);

    let replicateOutput;
    try {
      replicateOutput = await this.replicateProvider.run({
        model: modelId,
        input: modelInput,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Replicate generation failed: ${error.message}`);
        if (error.message.toLowerCase().includes('face')) {
          throw new BadRequestException(
            "We couldn't detect a face in the uploaded image. Please try a clearer, front-facing photo.",
          );
        }
        if (error.message.toLowerCase().includes('nsfw')) {
          throw new BadRequestException(
            'The operation was blocked due to the safety policy. Please try a different image.',
          );
        }
        throw new BadRequestException(
          'The AI model failed to generate an image. This can sometimes happen with complex requests. Please try again.',
        );
      } else {
        this.logger.error('Replicate generation failed with unknown error', error);
        throw new BadRequestException(
          'The AI model failed to generate an image. This can sometimes happen with complex requests. Please try again.',
        );
      }
    }

    const temporaryResultUrl = Array.isArray(replicateOutput) ? replicateOutput[0] : replicateOutput;

    if (!temporaryResultUrl || typeof temporaryResultUrl !== 'string') {
      this.logger.error('Could not parse a valid URL from Replicate output', replicateOutput);
      throw new Error('AI generation failed to return a valid image URL.');
    }

    const finalImageUpload = await this.uploadImageFromUrl(temporaryResultUrl);
    const resultImageUrl = this.optimizeCloudinaryUrl(finalImageUpload.secure_url);

    const [updatedUser, newGeneration] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 1 } },
      }),
      this.prisma.generation.create({
        data: {
          userId: user.id,
          sourceImageUrl, // Store optimized URL
          templateImageUrl: template.imageUrl,
          resultImageUrl, // Store optimized URL
        },
      }),
    ]);

    return {
      id: newGeneration.id,
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
