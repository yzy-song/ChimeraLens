// apps/api/src/generation/models.config.ts

// 定义 formatInput 函数接收的动态参数
interface ModelInput {
  templateImageUrl: string;
  sourceImageUrl: string;
}

// 定义每个模型的配置
export interface ModelConfig {
  id: string;
  formatInput: (input: ModelInput, options?: Record<string, any>) => Record<string, any>;
}

// 我们的模型库
export const MODELS: Record<string, ModelConfig> = {
  // 我们来用一个更稳定、更受欢迎的模型
  'stable-swap-v1': {
    id: 'codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34',
    // 即使这个模型用不到 options，我们也要在函数签名中定义它，以保持类型一致
    formatInput: ({ templateImageUrl, sourceImageUrl }, options = {}) => ({
      target_image: templateImageUrl,
      swap_image: sourceImageUrl,
    }),
  },

  'sepehr-mirage': {
    id: 'sepehr/mirage-gpu:754b60868afac702d4d84554d44bfd3daba56675af0217dc90940e570f579be1',
    formatInput: ({ templateImageUrl, sourceImageUrl }, options = {}) => ({
      source_image_file: sourceImageUrl,
      target_image_file: templateImageUrl,
      weight: 0.5,
      det_thresh: 0.1,
      ...options,
    }),
  },

  'pikachu-faceswap': {
    id: 'pikachupichu25/image-faceswap:94b109952d4dd3cb6e9947340a6a099cc9a4821af8807a879c1f7af92e2a3b00',
    formatInput: ({ templateImageUrl, sourceImageUrl }, options = {}) => ({
      target_image: templateImageUrl,
      swap_image: sourceImageUrl,
      output_format: 'webp',
      output_quality: 80,
      ...options,
    }),
  },
};
