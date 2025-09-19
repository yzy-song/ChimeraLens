"use client";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types";
import { toast } from "sonner";

interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

const createCheckoutSession = async (
  priceId: string
): Promise<ApiResponse<CheckoutSessionResponse>> => {
  const { data } = await api.post("/billing/create-checkout-session", {
    priceId,
  });
  return data;
};

export function useCreateCheckout() {
  return useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (response) => {
      const checkoutUrl = response.data.url;
      // 获取到 URL 后，直接跳转到 Stripe 支付页面
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.error("Could not redirect to checkout. Please try again.");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
