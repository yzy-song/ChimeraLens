"use client";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types";

// 定义 API 成功返回的数据结构
interface GenerationResult {
  resultImageUrl: string;
  credits: number;
}

// 定义调用 mutation 时需要传入的参数类型
interface GenerationPayload {
  sourceImage: File;
  templateImageUrl: string;
  modelKey: string;
}

// 调用 API 的函数
const createGeneration = async (
  payload: GenerationPayload
): Promise<ApiResponse<GenerationResult>> => {
  // 文件上传需要使用 FormData
  const formData = new FormData();
  formData.append("sourceImage", payload.sourceImage);
  formData.append("templateImageUrl", payload.templateImageUrl);
  formData.append("modelKey", payload.modelKey);
  const { data } = await api.post("/generation", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export function useGeneration() {
  return useMutation({
    mutationFn: createGeneration,
  });
}
