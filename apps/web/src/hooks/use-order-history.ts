"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types";
import { Order } from "@chimeralens/db";

import { useAuthStore } from "@/store/auth.store";

const getOrderHistory = async (): Promise<ApiResponse<Order[]>> => {
  const { data } = await api.get("/billing/history");
  return data;
};

export function useOrderHistory() {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: ["orderHistory"],
    queryFn: getOrderHistory,
    enabled: !!token, // 只有登录用户才能获取
  });
}
