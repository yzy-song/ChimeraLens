"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types";
import { toast } from "sonner";
import { z } from "zod";
import { forgotPasswordSchema } from "@/lib/schemas/auth.schema";

const forgotPassword = async (
  payload: z.infer<typeof forgotPasswordSchema>
): Promise<ApiResponse<{ message: string }>> => {
  const { data } = await api.post("/auth/forgot-password", payload);
  return data;
};

export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPassword,
    onSuccess: (response) => {
      toast.info(response.data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
