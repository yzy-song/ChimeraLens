"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

interface LoginResponse {
  access_token: string;
}

const firebaseLogin = async (
  idToken: string
): Promise<ApiResponse<LoginResponse>> => {
  const { data } = await api.post("/auth/firebase-login", { idToken });
  return data;
};

export function useFirebaseLogin() {
  const queryClient = useQueryClient();
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: firebaseLogin,
    onSuccess: (response) => {
      const token = response.data.access_token;
      setToken(token); // 将我们自己的 token 存入 store
      toast.success("Login successful!");
      // 重新获取用户信息，以更新 UI
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
