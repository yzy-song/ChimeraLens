'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import imageCompression from 'browser-image-compression';

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
}

function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function ImageUploader({ onFileSelect }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

      const options = {
        maxSizeMB: 2, // 限制最大体积为 2MB
        maxWidthOrHeight: 1920, // 限制最大尺寸
        useWebWorker: true,
      };

      try {
        const compressedFile = await imageCompression(file, options); // <-- 3. 压缩图片
        console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

        const newPreviewUrl = URL.createObjectURL(compressedFile);
        setPreviewUrl(newPreviewUrl);
        onFileSelect(compressedFile); // <-- 4. 将压缩后的文件传给父组件
      } catch (error) {
        console.error('Image compression failed:', error);
        // 如果压缩失败，可以考虑用原图上传或提示用户
        alert('Image processing failed. Please try another image.');
      }
    }
  };

  // 清理URL对象以避免内存泄漏
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);


  return (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-bold mb-4 text-center">Upload Your Photo</h2>
      <div
        className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
        {previewUrl ? (
          <img src={previewUrl} alt="Image preview" className="mx-auto h-40 w-40 rounded-full object-cover" />
        ) : (
          <p className="text-gray-500">
            {isMobile
              ? 'Tap to upload photo'
              : 'Click to upload or drag & drop'}
          </p>
        )}
      </div>
    </div>
  );
}