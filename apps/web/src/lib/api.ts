import axios from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

// --- Modern Fingerprint Generation Logic ---
let fingerprint: string | null = null;

const getFingerprint = async (): Promise<string> => {
  if (fingerprint) {
    return fingerprint;
  }

  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    fingerprint = result.visitorId;
    return fingerprint;
  } catch (error) {
    console.error("Fingerprint generation failed:", error);
    // Fallback to a simple random string if generation fails
    return `fallback_${Math.random().toString(36).substring(2, 15)}`;
  }
};

// Eagerly generate the fingerprint when the app loads
if (typeof window !== "undefined") {
  getFingerprint();
}
// --- End of Fingerprint Logic ---

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
});

api.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (typeof window !== "undefined") {
      const guestId = localStorage.getItem("guestId");
      if (guestId) {
        config.headers["x-guest-id"] = guestId;
      }
      // Asynchronously get and add the device fingerprint
      const fp = await getFingerprint();
      config.headers["x-fingerprint"] = fp;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorMessage =
        error.response?.data?.message ||
        "Authentication failed. Please check your credentials.";

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
