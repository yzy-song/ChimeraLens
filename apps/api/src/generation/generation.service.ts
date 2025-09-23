import { MODELS } from './models.config';
import { Injectable, ForbiddenException, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@chimeralens/db';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { ReplicateProvider } from './providers/replicate.provider';
import { TEMPLATES_DATA } from '../templates/templates.data';
import { paginate } from 'src/common/utils/pagination.util';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import sharp from 'sharp';
import axios from 'axios';
import { join } from 'path';
import { CreateGenerationDto } from './dto/create-generation.dto';

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

  private optimizeCloudinaryUrl(url: string): string {
    if (!url || !url.includes('/upload/')) {
      return url;
    }
    const parts = url.split('/upload/');
    const optimizedUrl = `${parts[0]}/upload/f_auto,q_auto/${parts[1]}`;
    this.logger.log(`Optimizing Cloudinary URL: ${url} -> ${optimizedUrl}`);
    return optimizedUrl;
  }

  private async _cropImageToFace(
    imageBuffer: Buffer,
    box: { x: number; y: number; width: number; height: number },
  ): Promise<Buffer> {
    this.logger.log('Cropping image to selected face...');
    try {
      const croppedBuffer = await sharp(imageBuffer)
        .extract({
          left: Math.floor(box.x),
          top: Math.floor(box.y),
          width: Math.floor(box.width),
          height: Math.floor(box.height),
        })
        .toBuffer();
      this.logger.log('Image cropped successfully.');
      return croppedBuffer;
    } catch (error) {
      this.logger.error('Failed to crop image', error);
      throw new BadRequestException('Failed to process the selected face area.');
    }
  }

  private async uploadImageFromBuffer(fileBuffer: Buffer): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ resource_type: 'image', folder: 'chimeralens/user_uploads' }, (error, result) => {
          if (error) return reject(new Error(error.message || String(error)));
          if (!result) return reject(new Error('Cloudinary upload failed.'));
          resolve(result);
        })
        .end(fileBuffer);
    });
  }

  private async uploadImageFromUrl(imageUrl: string): Promise<UploadApiResponse> {
    try {
      this.logger.log(`Transferring image from URL to Cloudinary: ${imageUrl}`);
      const result = await cloudinary.uploader.upload(imageUrl, { folder: 'chimeralens/results' });
      this.logger.log('Image transferred to Cloudinary successfully.');
      return result;
    } catch (error) {
      this.logger.error('Failed to transfer image from URL to Cloudinary', error);
      throw new Error('Failed to save the generated image.');
    }
  }

  async createGeneration(
    user: Omit<User, 'password'>,
    sourceImage: Express.Multer.File,
    generationDto: CreateGenerationDto,
  ) {
    const { templateId, modelKey, options, faceSelection } = generationDto;

    const template = TEMPLATES_DATA.find((t) => t.id === templateId);
    if (!template) throw new NotFoundException('Template not found');

    if (template.isPremium && user.isGuest) {
      throw new ForbiddenException('This is a premium template. Please log in or register to use it.');
    }
    if (user.credits <= 0) throw new ForbiddenException('Insufficient credits');

    const modelConfig = MODELS[modelKey];
    if (!modelConfig) throw new Error(`Model with key '${modelKey}' not found.`);

    // --- 核心改动: 裁剪逻辑 ---
    let imageBufferToProcess = sourceImage.buffer;
    if (faceSelection) {
      imageBufferToProcess = await this._cropImageToFace(sourceImage.buffer, faceSelection);
    }

    // 上传（可能被裁剪过的）图片到 Cloudinary
    const sourceImageUpload = await this.uploadImageFromBuffer(imageBufferToProcess);
    const sourceImageUrl = this.optimizeCloudinaryUrl(sourceImageUpload.secure_url);

    const modelInput = modelConfig.formatInput({ templateImageUrl: template.imageUrl, sourceImageUrl }, options);
    const modelId = modelConfig.id;

    this.logger.log('--- Sending to Replicate ---');
    this.logger.log(`Model ID: ${modelId}`);

    let replicateOutput;
    try {
      replicateOutput = await this.replicateProvider.run({ model: modelId, input: modelInput });
    } catch (error) {
      this.logger.error('Replicate generation failed111:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Replicate generation failed222: ${errorMessage}`);
      if (errorMessage.toLowerCase().includes('face')) {
        throw new BadRequestException('Generation failed: No face was detected. Please try another photo.');
      }
      throw new BadRequestException('AI generation failed. Please try again later.');
    }

    const temporaryResultUrl = Array.isArray(replicateOutput) ? replicateOutput[0] : replicateOutput;
    if (!temporaryResultUrl || typeof temporaryResultUrl !== 'string') {
      throw new Error('AI generation failed to return a valid image URL.');
    }

    const finalImage = await this.uploadImageFromUrl(temporaryResultUrl);
    const optimizedUrl = this.optimizeCloudinaryUrl(finalImage.secure_url);

    // --- 保存原始、完整的图片URL ---
    const originalSourceImageUrl = faceSelection
      ? (await this.uploadImageFromBuffer(sourceImage.buffer)).secure_url
      : sourceImageUrl;

    const [updatedUser, newGeneration] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 1 } },
      }),
      this.prisma.generation.create({
        data: {
          id: finalImage.public_id.split('/').pop(), // 获取更可靠的ID
          userId: user.id,
          sourceImageUrl: this.optimizeCloudinaryUrl(originalSourceImageUrl),
          templateImageUrl: template.imageUrl,
          resultImageUrl: optimizedUrl,
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
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.generation.count({ where: whereClause }),
    ]);
    this.logger.log('cache missed - fetched from DB');
    return paginate(items, total, page, limit);
  }

  async findOneById(id: string) {
    this.logger.log(`Fetching generation by ID: ${id}`);
    return this.prisma.generation.findUnique({ where: { id } });
  }

  async downloadGeneration(id: string): Promise<Buffer> {
    this.logger.log(`Processing download request for generation: ${id}`);
    const generation = await this.prisma.generation.findUnique({ where: { id } });
    if (!generation) throw new NotFoundException('Generation not found');

    const originalUrl = generation.resultImageUrl.replace('/f_auto,q_auto/', '/');
    const response = await axios.get(originalUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');

    const logoPath = join(process.cwd(), 'public', 'logo.png');

    const watermarkedBuffer = await sharp(imageBuffer)
      .composite([{ input: logoPath, gravity: 'southeast' }])
      .png({ quality: 90, compressionLevel: 6 })
      .toBuffer();

    this.logger.log(`Successfully watermarked image: ${id}`);
    return watermarkedBuffer;
  }
}
