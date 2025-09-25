import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => {
        // 登录成功时，也清除 guestId
        localStorage.removeItem("guestId");
        localStorage.setItem("auth_token", token);
        set({ token });
      },
      logout: () => {
        // 登出时，同时清除 token 和 guestId
        localStorage.removeItem("guestId");
        localStorage.removeItem("auth_token");
        set({ token: null });
      },
    }),
    { name: "auth-storage" }
  )
);
