// 定义一个标准化的输入结构
interface ModelInput {
  templateImageUrl: string;
  sourceImageUrl: string;
}

// 定义每个模型的配置
export interface ModelConfig {
  id: string; // Replicate 上的 model:version 字符串
  formatInput: (input: ModelInput) => Record<string, any>; // 一个函数，用于格式化输入
}

// 我们的模型库
export const MODELS: Record<string, ModelConfig> = {
  // 我们来用一个更稳定、更受欢迎的模型
  'stable-swap-v1': {
    id: 'omniedgeio/face-swap:c92553e433994353a2a7818987b15a6b73a628833b7643b0a701b2257d3419ba',
    formatInput: ({ templateImageUrl, sourceImageUrl }) => ({
      target_image: templateImageUrl,
      swap_image: sourceImageUrl,
    }),
  },
  'unstable-swap-v2': {
    id: 'codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34',
    formatInput: ({ templateImageUrl, sourceImageUrl }) => ({
      input_image: templateImageUrl,
      swap_image: sourceImageUrl,
    }),
  },
  // 未来你可以轻松地在这里添加更多模型
};
