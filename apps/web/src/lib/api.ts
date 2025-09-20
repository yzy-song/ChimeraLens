import axios from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
});

/**
 * 请求拦截器:
 * 优先处理登录用户的 JWT token。
 * 如果是游客，则回退处理 guestId。
 */
api.interceptors.request.use(
  (config) => {
    // 将来我们会从 Zustand/Redux 等状态管理器中获取 token
    const token = useAuthStore.getState().token;

    if (token) {
      // 如果用户已登录，我们发送 JWT Token
      config.headers.Authorization = `Bearer ${token}`;
    } else if (typeof window !== "undefined") {
      // 如果是游客，我们发送 guestId
      const guestId = localStorage.getItem("guestId");
      if (guestId) {
        config.headers["x-guest-id"] = guestId;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器:
 * 全局处理 API 错误，特别是 401 权限问题。
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorMessage =
        error.response?.data?.message ||
        "Authentication failed. Please check your credentials.";

      // 只有 token 失效时才登出
      if (
        errorMessage.includes("expired") ||
        errorMessage.includes("invalid token")
      ) {
        useAuthStore.getState().logout();
      }

      return Promise.reject(new Error(errorMessage));
    }

    const errorMessage =
      error.response?.data?.message ||
      "An unexpected error occurred. Please try again.";

    return Promise.reject(new Error(errorMessage));
  }
);
