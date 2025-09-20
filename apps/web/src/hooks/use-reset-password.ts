"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ResetPasswordPayload {
  token: string;
  password: string;
}

const resetPassword = async (
  payload: ResetPasswordPayload
): Promise<ApiResponse<{ message: string }>> => {
  const { data } = await api.post("/auth/reset-password", payload);
  return data;
};

export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: resetPassword,
    onSuccess: (response) => {
      toast.success(
        response.data.message ||
          "Password has been reset successfully. Please log in."
      );
      // Redirect to home page where login modal can be opened
      router.push("/");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
