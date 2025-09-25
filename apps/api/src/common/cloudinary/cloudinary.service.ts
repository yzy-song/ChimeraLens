import { Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
        // 如果有错误，直接 reject 原始错误对象
        if (error) {
          return reject(new Error(error instanceof Error ? error.message : String(error)));
        }
        // 如果没有错误，Cloudinary SDK 会保证 result 有值
        // 我们使用类型断言告诉 TypeScript 这是成功的响应
        resolve(result);
      });
      upload.end(file.buffer);
    });
  }

  async uploadImageFromBuffer(fileBuffer: Buffer, folder = 'chimeralens/user_uploads'): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ resource_type: 'image', folder }, (error, result) => {
          if (error) return reject(new Error(error.message || String(error)));
          if (!result) return reject(new Error('Cloudinary upload failed.'));
          resolve(result);
        })
        .end(fileBuffer);
    });
  }

  async uploadImageFromUrl(imageUrl: string, folder = 'chimeralens/results'): Promise<UploadApiResponse> {
    return cloudinary.uploader.upload(imageUrl, { folder });
  }

  async deleteImage(publicId: string, folder?: string): Promise<any> {
    if (folder) {
      return cloudinary.uploader.destroy(`${folder}/${publicId}`, { resource_type: 'image' });
    } else {
      return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    }
  }

  optimizeCloudinaryUrl(url: string): string {
    if (!url || !url.includes('/upload/')) {
      return url;
    }
    const parts = url.split('/upload/');
    return `${parts[0]}/upload/f_auto,q_auto/${parts[1]}`;
  }

  getPublicIdFromUrl(url: string): string {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    const [publicId] = lastPart.split('.');
    return publicId;
  }
}
