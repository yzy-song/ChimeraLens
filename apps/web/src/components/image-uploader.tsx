'use client';

import { useState, useRef, ChangeEvent, DragEvent, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Camera, Upload, XCircle, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageUploaderProps {
  onFileSelect: (file: File | null) => void;
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function ImageUploader({ onFileSelect }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  
  // Create separate refs for file upload and camera capture
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
        toast.error('Invalid file type. Please upload an image.');
        return;
    }

    setIsLoading(true);
    onFileSelect(null);
    setFileDetails(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);


    const options = { maxSizeMB: 5, maxWidthOrHeight: 1920, useWebWorker: true };
    try {
      const compressedFile = await imageCompression(file, options);
      const newPreviewUrl = URL.createObjectURL(compressedFile);
      setPreviewUrl(newPreviewUrl);
      onFileSelect(compressedFile);
      setFileDetails({
          name: compressedFile.name,
          size: formatFileSize(compressedFile.size)
      });
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
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  };
  
  const handleClear = () => {
      if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setFileDetails(null);
      onFileSelect(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
    }
  };

  // Drag and Drop Handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div 
        className={cn(
            "w-full p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors duration-200",
            isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-400"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
      {/* Hidden input for file selection from disk */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
       {/* Hidden input for triggering the native camera */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        capture="user"
      />
      
      <div className="w-full h-40 relative flex items-center justify-center mb-4 bg-gray-100 dark:bg-gray-800 rounded-md">
        {isLoading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
        ) : previewUrl ? (
          <>
            <img src={previewUrl} alt="Image preview" className="max-h-full max-w-full object-contain rounded-md" />
            <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 text-white" onClick={handleClear}>
              <XCircle className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <div className="text-center text-gray-500 pointer-events-none">
            <FileImage className="mx-auto h-10 w-10 mb-2" />
            <p className="font-semibold">Drag & drop an image here</p>
            <p className="text-xs">or click buttons below</p>
          </div>
        )}
      </div>

      {fileDetails && !isLoading && (
        <div className="text-xs text-muted-foreground mb-3 text-center">
            <p className="font-semibold truncate max-w-[200px]">{fileDetails.name}</p>
            <p>{fileDetails.size}</p>
        </div>
      )}
      
      <div className="flex items-center justify-center gap-4 w-full">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="flex-1">
              <Upload className="mr-2 h-4 w-4" />
              Upload File
          </Button>
          <Button variant="outline" onClick={() => cameraInputRef.current?.click()} disabled={isLoading} className="flex-1">
              <Camera className="mr-2 h-4 w-4" />
              Use Camera
          </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        For best results, use a clear, front-facing portrait photo without glasses or obstructions.
      </p>
    </div>
  );
}

