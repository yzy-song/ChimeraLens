import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Replicate from 'replicate';
import { AiProvider } from './ai-provider.interface';

@Injectable()
export class ReplicateProvider implements AiProvider {
  private replicate: Replicate;

  constructor(private readonly configService: ConfigService) {
    this.replicate = new Replicate({
      auth: this.configService.get<string>('REPLICATE_API_TOKEN'),
    });
  }

  async run(inputs: { model: string; input: Record<string, any> }): Promise<string | string[]> {
    const { model, input } = inputs;
    const output = await this.replicate.run(model as any, { input });
    return output as string | string[];
  }
}
