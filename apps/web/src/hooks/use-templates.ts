"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types";

// 定义 Template 对象的类型
export interface Template {
  id: string;
  name: string;
  style: string;
  imageUrl: string;
  isPremium?: boolean;
}

// 获取模板列表的 API 函数
const getTemplates = async (): Promise<ApiResponse<Template[]>> => {
  const { data } = await api.get("/templates");
  return data;
};

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"], // 缓存 key
    queryFn: getTemplates,
    // enabled: typeof window !== "undefined",
  });
}
