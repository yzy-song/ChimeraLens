"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types";
import { toast } from "sonner";

interface ChangePasswordPayload {
  newPassword: string;
  currentPassword?: string;
}

const changePassword = async (
  payload: ChangePasswordPayload
): Promise<ApiResponse<{ message: string }>> => {
  const { data } = await api.patch("/auth/password", payload);
  return data;
};

export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changePassword,
    onSuccess: (response) => {
      toast.success(response.data.message || "Password updated successfully!");
      // Invalidate user query to refetch and get updated `hasPassword` status
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
