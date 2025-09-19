'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Camera, Upload } from 'lucide-react';

export interface ImageUploaderProps {
  onFileSelect: (file: File | null) => void;
}

export function ImageUploader({ onFileSelect }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 1. 我们需要两个 ref，分别对应两个 input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsLoading(true);
    onFileSelect(null);

    const options = { maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true };
    try {
      const compressedFile = await imageCompression(file, options);
      const newPreviewUrl = URL.createObjectURL(compressedFile);
      setPreviewUrl(newPreviewUrl);
      onFileSelect(compressedFile);
    } catch (error) {
      console.error('Image processing failed:', error);
      toast.error('Image processing failed. Please try another image.');
      onFileSelect(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 两个 input 共用同一个处理函数
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // 清空 input 的值，确保下次选择相同文件也能触发 onChange
    event.target.value = '';
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="w-full p-4 border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center">
      {/* 3. 两个隐藏的 input 元素 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        capture="user" // <-- 核心属性，用于调用前置摄像头
      />

      {/* 预览区域 */}
      <div className="w-full h-40 flex items-center justify-center mb-4">
        {isLoading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        ) : previewUrl ? (
          <img src={previewUrl} alt="Image preview" className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="text-gray-500">Your photo preview</div>
        )}
      </div>
      
      {/* 操作按钮 */}
      <div className="flex items-center justify-center gap-4 w-full"> {/* <-- 将 grid grid-cols-2 改为 flex */}
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="flex-1">
              <Upload className="mr-2 h-4 w-4" />
              Upload
          </Button>
          <Button variant="outline" onClick={() => cameraInputRef.current?.click()} disabled={isLoading} className="flex-1">
              <Camera className="mr-2 h-4 w-4" />
              Photo
          </Button>
      </div>
    </div>
  );
}