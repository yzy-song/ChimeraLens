// apps/web/src/lib/api.ts
import axios from "axios";
// 我们未来会创建一个状态管理库，现在先注释掉
// import { useAuthStore } from '@/store/auth.store';

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
    // const token = useAuthStore.getState().token;
    const token = null; // 当前我们还没有登录功能，所以暂时设为 null

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
  (response) => response, // 成功的响应直接透传
  (error) => {
    // 统一处理错误
    if (error.response?.status === 401) {
      // 如果是 401 错误，通常意味着 token 失效
      // 这里可以触发全局的登出逻辑
      // useAuthStore.getState().logout();
      console.error("Authentication Error: Token might be expired or invalid.");
    }

    // 从后端响应中提取更具体的错误信息，如果没有则给一个通用提示
    const errorMessage =
      error.response?.data?.message ||
      "An unexpected error occurred. Please try again.";

    // 以 Error 的形式拒绝 Promise，这样 React Query 的 isError 状态就会被激活
    return Promise.reject(new Error(errorMessage));
  }
);
