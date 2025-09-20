"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Define the type for variables passed to the mutation
interface DownloadVariables {
  id: string;
  filename: string;
}

// The API returns the image data as a Blob
const downloadGeneration = async ({
  id,
  filename,
}: DownloadVariables): Promise<{ blob: Blob; filename: string }> => {
  const response = await api.get(`/generations/${id}/download`, {
    responseType: "blob", // Important: expect a binary response
  });

  // We return the blob and the original filename we passed in
  return { blob: response.data as Blob, filename };
};

export function useDownloadGeneration() {
  // 1. Get the raw mutation result from TanStack Query
  const mutation = useMutation({
    mutationFn: downloadGeneration,
    onSuccess: ({ blob, filename }) => {
      // Create a link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename); // Use the filename passed through the mutation
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download started!");
    },
    onError: (error) => {
      toast.error(`Download failed: ${error.message}`);
    },
  });

  // 2. Create a wrapper function for components to call
  const download = (id: string, filename: string) => {
    mutation.mutate({ id, filename });
  };

  // 3. Return a custom object with the properties our components expect
  return {
    download,
    isDownloading: mutation.isPending, // Rename isPending to isDownloading
  };
}
