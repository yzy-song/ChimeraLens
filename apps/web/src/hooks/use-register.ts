"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { z } from "zod";
import { registerSchema } from "@/lib/schemas/auth.schema";
import { LoginResponse } from "./use-firebase-login";

const register = async (
  payload: z.infer<typeof registerSchema>
): Promise<ApiResponse<LoginResponse>> => {
  const { data } = await api.post("/auth/register", payload);
  return data;
};

export function useRegister() {
  const queryClient = useQueryClient();
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: register,
    onSuccess: (response) => {
      const token = response.data.access_token;
      setToken(token);
      toast.success("Registration successful!");
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
