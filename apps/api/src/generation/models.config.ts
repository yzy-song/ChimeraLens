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
    id: 'cdingram/face-swap:d1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111',
    formatInput: ({ templateImageUrl, sourceImageUrl }) => ({
      target_image: templateImageUrl,
      swap_image: sourceImageUrl,
    }),
  },
  // This model costs approximately $0.0030 to run on Replicate, or 333 runs per $1, but this varies depending on your inputs. It is also open source and you can run it on your own computer with Docker.
  'unstable-swap-v2': {
    id: 'codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34',
    formatInput: ({ templateImageUrl, sourceImageUrl }) => ({
      input_image: templateImageUrl,
      swap_image: sourceImageUrl,
    }),
  },
  // 未来你可以轻松地在这里添加更多模型
};
