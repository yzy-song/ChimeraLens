"use client";
import { useQuery } from "@tanstack/react-query";
import { User } from "@chimeralens/db";
import { api } from "../lib/api";
import { ApiResponse } from "@/types";

interface UserData {
  user: User | null;
}

const getMe = async (): Promise<ApiResponse<UserData>> => {
  const { data } = await api.get("/auth/me");
  return data;
};

export function useUser() {
  // 只在客户端请求
  return useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    // enabled: typeof window !== "undefined", // 保留这一行也可以
    // suspense: false, // 可选
  });
}
