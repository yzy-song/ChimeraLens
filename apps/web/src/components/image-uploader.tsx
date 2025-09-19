'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Camera, Upload } from 'lucide-react';
import { CameraModal } from './camera-modal'; // <-- 1. 导入相机弹窗

export interface ImageUploaderProps {
  onFileSelect: (file: File | null) => void;
}

export function ImageUploader({ onFileSelect }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false); 
  const [isCameraSupported, setIsCameraSupported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 检查浏览器是否支持摄像头 API
  useEffect(() => {
    if (navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices) {
      setIsCameraSupported(true);
    }
  }, []);
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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };
  
  const handlePhotoCapture = (file: File) => {
    if (file) {
      processFile(file);
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <>
      <div className="w-full p-4 border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          disabled={isLoading}
        />
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : previewUrl ? (
          <img src={previewUrl} alt="Image preview" className="h-40 w-40 rounded-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-500">
            Your photo preview
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 mt-4 w-full">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                <Upload className="mr-2 h-4 w-4" />
                Upload File
            </Button>
            {isCameraSupported && (
              <Button variant="outline" onClick={() => setIsCameraOpen(true)} disabled={isLoading}>
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
            )}
        </div>
      </div>
      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onPhotoCapture={handlePhotoCapture}
      />
    </>
  );
}