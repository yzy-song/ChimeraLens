'use client';

import { useState, useRef, ChangeEvent, useEffect, DragEvent } from 'react';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Camera, Upload, XCircle, CheckCircle, Search, Trash2 } from 'lucide-react';
import { initializeFaceDetector, detectFace } from '@/lib/mediapipe'; // Import our new MediaPipe service

export interface ImageUploaderProps {
  onFileSelect: (file: File | null) => void;
}

// Define the component's state
type Status = 'idle' | 'compressing' | 'detecting' | 'ready' | 'error';

export function ImageUploader({ onFileSelect }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Pre-load the face detection models when the component mounts
  useEffect(() => {
    initializeFaceDetector();
  }, []);

  const resetState = () => {
    setPreviewUrl(null);
    setFileName(null);
    setStatus('idle');
    setErrorMessage(null);
    onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const processFile = async (file: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onFileSelect(null);
    setFileName(file.name);
    setStatus('compressing');
    setErrorMessage(null);

    const options = { maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true };

    try {
      const compressedFile = await imageCompression(file, options);
      const tempPreviewUrl = URL.createObjectURL(compressedFile);
      setPreviewUrl(tempPreviewUrl);
      
      setStatus('detecting');

      // Create an image element to pass to the detection function
      const image = new Image();
      image.src = tempPreviewUrl;
      await new Promise(resolve => image.onload = resolve);

      const hasFace = await detectFace(image);

      if (hasFace) {
        setStatus('ready');
        toast.success('Face detected! You are ready to generate.');
        onFileSelect(compressedFile);
      } else {
        setStatus('error');
        setErrorMessage("No face detected. Please use a clear, front-facing photo.");
        toast.error("No face detected. Please use a clear, front-facing photo.");
        onFileSelect(null);
      }
    } catch (error) {
      console.error('Image processing failed:', error);
      setStatus('error');
      const message = 'Image processing failed. Please try another image.';
      setErrorMessage(message);
      toast.error(message);
      onFileSelect(null);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragEvents = (e: DragEvent<HTMLDivElement>, isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isEntering);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    handleDragEvents(e, false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    } else {
      toast.warning('Please drop an image file.');
    }
  };

  const statusMessages: Record<Status, React.ReactNode> = {
    idle: <div className="text-gray-500">Your photo preview</div>,
    compressing: <div className="text-blue-500 animate-pulse">Compressing image...</div>,
    detecting: <div className="flex items-center text-purple-500 animate-pulse"><Search className="mr-2 h-4 w-4"/>Detecting face...</div>,
    ready: <div className="flex items-center text-green-600"><CheckCircle className="mr-2 h-4 w-4"/>Face detected!</div>,
    error: <div className="flex items-center text-red-600"><XCircle className="mr-2 h-4 w-4"/>{errorMessage}</div>,
  };

  const isLoading = status === 'compressing' || status === 'detecting';

  return (
    <div
      onDragEnter={(e) => handleDragEvents(e, true)}
      onDragLeave={(e) => handleDragEvents(e, false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={`w-full p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors
        ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-400'}`}
    >
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" />
      <input type="file" ref={cameraInputRef} onChange={handleFileChange} className="hidden" accept="image/*" capture="user" />

      <div className="w-full h-40 flex items-center justify-center mb-4 relative">
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Image preview" className="max-h-full max-w-full object-contain rounded-md" />
            <Button variant="ghost" size="icon" onClick={resetState} className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full h-7 w-7" disabled={isLoading}>
                <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="text-gray-500 text-center">
            <p>Drag & drop your photo here, or use the buttons below.</p>
          </div>
        )}
      </div>
      
      <div className="h-6 mb-2 flex items-center justify-center">
        {statusMessages[status]}
      </div>

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
       <p className="text-xs text-muted-foreground mt-3 text-center">
        For best results, use a clear, well-lit, front-facing portrait photo.
      </p>
    </div>
  );
}

