import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Replicate from 'replicate';
import { AiProvider } from './ai-provider.interface';

@Injectable()
export class ReplicateProvider implements AiProvider {
  private replicate: Replicate;
  private readonly logger = new Logger(ReplicateProvider.name);

  constructor(private readonly configService: ConfigService) {
    this.replicate = new Replicate({
      auth: this.configService.get<string>('REPLICATE_API_TOKEN'),
    });
  }

  // A helper function to add a delay
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async run(inputs: { model: string; input: Record<string, any> }): Promise<string | string[]> {
    const { model, input } = inputs;
    const [owner, name_and_version] = model.split('/');
    const [name, version] = name_and_version.split(':');

    this.logger.log('Step 1: Creating prediction...');

    // 1. 创建预测任务，但这次我们不等待它完成
    let prediction = await this.replicate.predictions.create({
      version: version,
      input: input,
    });

    const predictionId = prediction.id;
    this.logger.log(`Prediction created with ID: ${predictionId}`);

    const maxPollTime = 60000; // 60 seconds timeout
    const pollInterval = 2000; // 2 seconds interval
    const startTime = Date.now();

    // 2. 开始轮询任务状态
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
      // Check for timeout
      if (Date.now() - startTime > maxPollTime) {
        throw new Error('Prediction timed out after 60 seconds.');
      }

      // Wait for a couple of seconds before polling again
      await this.sleep(pollInterval);

      // Get the latest status of the prediction
      prediction = await this.replicate.predictions.get(predictionId);
      this.logger.log(`Polling... Current status: ${prediction.status}`);
    }

    if (prediction.status === 'succeeded') {
      this.logger.log('Prediction succeeded!');
      return prediction.output as string | string[];
    } else {
      this.logger.error('Prediction failed or was canceled.', prediction.error);
      throw new Error(
        `Prediction failed with status: ${prediction.status}. Error: ${typeof prediction.error === 'string' ? prediction.error : JSON.stringify(prediction.error)}`,
      );
    }
  }
}
