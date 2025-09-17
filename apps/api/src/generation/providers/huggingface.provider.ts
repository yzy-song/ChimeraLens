import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InferenceClient } from '@huggingface/inference';
import { AiProvider } from './ai-provider.interface';

// HuggingFace 的 image-to-image 模型通常返回 Blob，我们需要转换它
async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) =>
      reject(
        new Error(
          e instanceof ErrorEvent && e.message ? e.message : 'FileReader error',
        ),
      );
    reader.readAsDataURL(blob);
  });
}

@Injectable()
export class HuggingFaceProvider implements AiProvider {
  private hf: InferenceClient;

  constructor(private readonly configService: ConfigService) {
    this.hf = new InferenceClient(
      this.configService.get<string>('HUGGINGFACE_API_TOKEN'),
    );
  }

  async run(inputs: {
    model: string;
    input: Record<string, any>;
  }): Promise<string> {
    const { model, input } = inputs;

    // HuggingFace 的 image-to-image 模型需要图片是 Blob 格式
    const sourceImageResponse = await fetch(input.swap_image);
    const sourceImageBlob = await sourceImageResponse.blob();

    // 调用 HF 的 imageToImage 模型
    const resultBlob = await this.hf.imageToImage({
      model: model,
      inputs: sourceImageBlob,
      parameters: {
        // 不同的模型有不同的参数，这里只是一个示例
        prompt: 'A picture of a person, photorealistic',
      },
    });

    // 因为 HF 直接返回图片数据 (Blob)，我们需要将其转换为可用的格式
    // 这里我们选择转为 Base64 Data URL。更好的方案是再上传到 Cloudinary 返回 URL
    return blobToDataURL(resultBlob);
  }
}
