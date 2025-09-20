"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

// This function will fetch the image blob from our API
const downloadImage = async (
  generationId: string
): Promise<{ blob: Blob; filename: string }> => {
  const response = await api.get(`/generations/${generationId}/download`, {
    responseType: "blob", // This is crucial to get the file data correctly
  });

  // Extract filename from Content-Disposition header if available, otherwise create a default one
  const contentDisposition = response.headers["content-disposition"];
  let filename = `chimeralens-result-${generationId.substring(0, 6)}.png`; // default filename
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
    if (filenameMatch && filenameMatch.length === 2) {
      filename = filenameMatch[1];
    }
  }

  return { blob: new Blob([response.data], { type: "image/png" }), filename };
};

export function useDownloadGeneration() {
  return useMutation({
    mutationFn: downloadImage,
    onSuccess: ({ blob, filename }) => {
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a link and trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Clean up the temporary URL and link
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download started!");
    },
    onError: (error) => {
      console.error("Download failed:", error);
      toast.error("Could not download the file. Please try again.");
    },
    onMutate: () => {
      toast.info("Preparing your download...");
    },
  });
}
