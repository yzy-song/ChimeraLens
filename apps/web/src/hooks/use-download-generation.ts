"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

// 这个函数会从 API 获取 Blob 数据和文件名
const downloadApi = async (
  id: string
): Promise<{ blob: Blob; filename: string }> => {
  const response = await api.get(`/generations/${id}/download`, {
    responseType: "blob", // 明确我们期望的是二进制数据
  });

  // 从服务器的响应头中提取文件名
  const contentDisposition = response.headers["content-disposition"];
  let filename = `chimeralens-result-${id.substring(0, 6)}.png`; // 设置一个默认文件名
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (filenameMatch && filenameMatch.length > 1) {
      filename = filenameMatch[1];
    }
  }

  return { blob: response.data as Blob, filename };
};

export function useDownloadGeneration() {
  const { mutate, isPending } = useMutation({
    mutationFn: downloadApi,
    onSuccess: (data) => {
      // 从 data 对象中解构出 blob 和 filename
      const { blob, filename } = data;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename); // 使用从服务器获取的文件名
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download started!");
    },
    onError: (error) => {
      toast.error(error.message || "Download failed. Please try again.");
    },
  });

  const download = (id: string) => {
    mutate(id);
  };

  return { download, isDownloading: isPending };
}
