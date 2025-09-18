"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { z } from "zod";
import { loginSchema } from "@/lib/schemas/auth.schema";

interface LoginResponse {
  access_token: string;
}

const login = async (
  payload: z.infer<typeof loginSchema>
): Promise<ApiResponse<LoginResponse>> => {
  const { data } = await api.post("/auth/login", payload);
  return data;
};

export function useLogin() {
  const queryClient = useQueryClient();
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      const token = response.data.access_token;
      setToken(token);
      toast.success("Login successful!");
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
