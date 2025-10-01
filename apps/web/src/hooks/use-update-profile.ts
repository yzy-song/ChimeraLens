"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types";
import { toast } from "sonner";

interface UpdateProfilePayload {
  name?: string;
}

const updateProfile = async (
  payload: UpdateProfilePayload
): Promise<ApiResponse<{ message: string }>> => {
  const { data } = await api.patch("/auth/profile", payload);
  return data;
};

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (response) => {
      toast.success("Profile updated successfully!");
      // 更新用户信息，让 UserNav 等组件显示新名字
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
