"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types";
import { Generation } from "@chimeralens/db";

const getGenerationById = async (
  id: string
): Promise<ApiResponse<Generation>> => {
  const { data } = await api.get(`/generations/${id}`);
  return data;
};

export function useGenerationById(id: string) {
  return useQuery({
    queryKey: ["generation", id],
    queryFn: () => getGenerationById(id),
    enabled: !!id, // 只有在 id 存在时才执行查询
  });
}
