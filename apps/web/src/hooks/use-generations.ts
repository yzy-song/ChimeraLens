// 负责获取和展示作品集列表
"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types";
import { Generation } from "@chimeralens/db"; // 直接从共享包导入类型

// 定义分页数据的结构
interface PaginatedGenerations {
  data: Generation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

// 定义 Hook 接收的参数
interface GetGenerationsQuery {
  page: number;
  limit: number;
}

const getGenerations = async ({
  page,
  limit,
}: GetGenerationsQuery): Promise<ApiResponse<PaginatedGenerations>> => {
  const { data } = await api.get("/generations", {
    params: { page, limit },
  });
  return data;
};

export function useGenerations({ page, limit }: GetGenerationsQuery) {
  return useQuery({
    // queryKey 必须包含 page 和 limit，以确保翻页时能正确地重新获取和缓存数据
    queryKey: ["generations", { page, limit }],
    queryFn: () => getGenerations({ page, limit }),
    // enabled: typeof window !== 'undefined',
  });
}
