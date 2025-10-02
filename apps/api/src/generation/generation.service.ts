import { MODELS } from './models.config';
import { Injectable, ForbiddenException, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@chimeralens/db';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
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
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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

    const cost = template.cost || 1;
    if (user.credits < cost)
      throw new ForbiddenException(`Insufficient credits. This template requires ${cost} credits.`);

    const modelConfig = MODELS[modelKey];
    if (!modelConfig) throw new Error(`Model with key '${modelKey}' not found.`);

    // --- 核心改动: 裁剪逻辑 ---
    let imageBufferToProcess = sourceImage.buffer;
    if (faceSelection) {
      imageBufferToProcess = await this._cropImageToFace(sourceImage.buffer, faceSelection);
    }

    // 上传图片到 Cloudinary
    const sourceImageUpload = await this.cloudinaryService.uploadImageFromBuffer(imageBufferToProcess);
    const sourceImageUrl = this.cloudinaryService.optimizeCloudinaryUrl(sourceImageUpload.secure_url);

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

    const finalImage = await this.cloudinaryService.uploadImageFromUrl(temporaryResultUrl);
    const optimizedUrl = this.cloudinaryService.optimizeCloudinaryUrl(finalImage.secure_url);

    // --- 保存原始、完整的图片URL ---
    const originalSourceImageUrl = faceSelection
      ? (await this.cloudinaryService.uploadImageFromBuffer(sourceImage.buffer)).secure_url
      : sourceImageUrl;

    const [updatedUser, newGeneration] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: cost } },
      }),
      this.prisma.generation.create({
        data: {
          id: finalImage.public_id.split('/').pop(), // 获取更可靠的ID
          userId: user.id,
          sourceImageUrl: this.cloudinaryService.optimizeCloudinaryUrl(originalSourceImageUrl),
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

  async remove(id: string, userId: string) {
    const generation = await this.prisma.generation.findUnique({ where: { id } });
    if (!generation || generation.userId !== userId) {
      throw new Error('Not allowed to delete this artwork');
    }

    // 删除 Cloudinary 图片
    const sourcePublicId = this.cloudinaryService.getPublicIdFromUrl(generation.sourceImageUrl);
    const resultPublicId = this.cloudinaryService.getPublicIdFromUrl(generation.resultImageUrl);

    if (sourcePublicId) {
      await this.cloudinaryService.deleteImage(sourcePublicId, 'chimeralens/user_uploads');
    }
    if (resultPublicId && resultPublicId !== sourcePublicId) {
      await this.cloudinaryService.deleteImage(resultPublicId, 'chimeralens/results');
    }

    await this.prisma.generation.delete({ where: { id } });
    return { success: true };
  }
}
