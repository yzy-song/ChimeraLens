'use client';

import { useState, useRef, ChangeEvent, useEffect,DragEvent } from 'react';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Upload, X, CheckCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { detectFaces, FaceBoundingBox } from '@/lib/mediapipe';
import { Skeleton } from './ui/skeleton';

// 定义组件向父组件传递的数据结构
export interface ImageUploaderResult {
  file: File;
  faceSelection?: FaceBoundingBox; // 可选的人脸选择坐标
}

export interface ImageUploaderProps {
  onFileSelect: (result: ImageUploaderResult | null) => void;
}

export function ImageUploader({ onFileSelect }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  
  // 状态管理
  const [status, setStatus] = useState<'idle' | 'compressing' | 'detecting' | 'success_single' | 'success_multiple' | 'success_random' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  // 人脸检测相关状态
  const [detectedFaces, setDetectedFaces] = useState<FaceBoundingBox[]>([]);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState<number | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const compressedFileRef = useRef<File | null>(null); 

  // --- 核心处理逻辑 ---
  const processFile = async (file: File) => {
    resetState();
    setStatus('compressing');

    try {
      const options = { maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      compressedFileRef.current = compressedFile;
      
      setStatus('detecting');
      
      const faces = await detectFaces(compressedFile);
      
      // 没检测到脸，是否应该直接放行交给replicate处理?
      // if (faces.length === 0) {
      //   throw new Error('No face detected in the image. Please try another one.');
      // }

      const newPreviewUrl = URL.createObjectURL(compressedFile);
      setPreviewUrl(newPreviewUrl);
      setFileName(compressedFile.name);
      setFileSize(`${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
      setDetectedFaces(faces);

      if (faces.length === 0) {
        setStatus('success_random');
        onFileSelect({ file: compressedFile }); // 不传 faceSelection，直接放行
        // toast.info('No face detected. The image will be processed by AI.');
      } else if (faces.length === 1) {
        setStatus('success_single');
        onFileSelect({ file: compressedFile, faceSelection: faces[0] });
        // toast.success('One face detected. Ready to go!');
      } else {
        setStatus('success_multiple');
        setSelectedFaceIndex(0);
        onFileSelect({ file: compressedFile, faceSelection: faces[0] });
        toast.info('Multiple faces found. Tap to select.');
      }

    } catch (error: any) {
      setStatus('error');
      const message = error.message || 'Image processing failed.';
      setErrorMessage(message);
      toast.error(message);
      onFileSelect(null);
    }
  };

  // --- Canvas 绘制逻辑 ---
  useEffect(() => {
    if (status === 'success_multiple' && canvasRef.current && previewUrl && detectedFaces.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      img.onload = () => {
        const parent = canvas.parentElement;
        if (!parent) return;

        const parentWidth = parent.clientWidth;
        const parentHeight = parent.clientHeight;
        const imgAspectRatio = img.naturalWidth / img.naturalHeight;
        
        let canvasWidth = parentWidth;
        let canvasHeight = parentWidth / imgAspectRatio;

        if (canvasHeight > parentHeight) {
            canvasHeight = parentHeight;
            canvasWidth = parentHeight * imgAspectRatio;
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const scaleX = canvas.width / img.naturalWidth;
        const scaleY = canvas.height / img.naturalHeight;

        detectedFaces.forEach((box, index) => {
          ctx.strokeStyle = index === selectedFaceIndex ? '#3b82f6' : 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = index === selectedFaceIndex ? 4 : 2;
          ctx.strokeRect(box.x * scaleX, box.y * scaleY, box.width * scaleX, box.height * scaleY);
        });
      };
      img.src = previewUrl;
    }
  }, [status, previewUrl, detectedFaces, selectedFaceIndex]);


  // --- 事件处理 ---
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
    event.target.value = '';
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

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || detectedFaces.length <= 1 || !previewUrl) return;
  
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // 将点击坐标从屏幕坐标系转换到 Canvas 坐标系
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
  
    // 将 Canvas 坐标系转换到原始图片坐标系
    const img = new Image();
    img.src = previewUrl; // 假设 previewUrl 已经加载
    const scaleX = canvas.width / img.naturalWidth;
    const scaleY = canvas.height / img.naturalHeight;
  
    const clickedFaceIndex = detectedFaces.findIndex(box => {
      const scaledBox = {
        x: box.x * scaleX,
        y: box.y * scaleY,
        width: box.width * scaleX,
        height: box.height * scaleY,
      };
      return (
        canvasX >= scaledBox.x &&
        canvasX <= scaledBox.x + scaledBox.width &&
        canvasY >= scaledBox.y &&
        canvasY <= scaledBox.y + scaledBox.height
      );
    });
  
    if (clickedFaceIndex > -1 && compressedFileRef.current) {
      setSelectedFaceIndex(clickedFaceIndex);
      onFileSelect({ file: compressedFileRef.current, faceSelection: detectedFaces[clickedFaceIndex] });
      toast.info(`Face #${clickedFaceIndex + 1} selected.`);
    }
  };
  
  
  const resetState = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileName('');
    setFileSize('');
    setStatus('idle');
    setErrorMessage('');
    onFileSelect(null);
    setDetectedFaces([]);
    setSelectedFaceIndex(null);
    compressedFileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };
  
  return (
    <div onDragEnter={(e) => handleDragEvents(e, true)}
      onDragLeave={(e) => handleDragEvents(e, false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={`w-full p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors
        ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-400'}`}>
      
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" />
      <input type="file" ref={cameraInputRef} onChange={handleFileChange} className="hidden" accept="image/*" capture="user" />

      <div className="w-full aspect-square flex items-center justify-center bg-background rounded-md relative overflow-hidden">
        {status === 'idle' && <p className="text-gray-500">Your photo will appear here</p>}
        {(status === 'compressing' || status === 'detecting') && (
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="w-24 h-4" />
            <p className="text-muted-foreground animate-pulse">{status === 'compressing' ? 'Compressing image...' : 'Detecting faces...'}</p>
          </div>
        )}
        {status === 'error' && <p className="text-destructive p-4 text-center">{errorMessage}</p>}

        {previewUrl && (status.startsWith('success')) && (
          <>
            {status === 'success_random' && <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" />}
            {status === 'success_single' && <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" />}
            {status === 'success_multiple' && <canvas ref={canvasRef} onClick={handleCanvasClick} className="cursor-pointer" />}
            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full z-10" onClick={resetState}>
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      
      {fileName && (
        <div className="w-full text-center text-sm">
          <p className="font-medium truncate">{fileName}</p>
          <p className="text-muted-foreground">{fileSize}</p>
        </div>
      )}

      {status === 'success_random' && (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-3 py-1.5 rounded-full text-sm">
          <CheckCircle className="h-4 w-4" />
          <span>The image will be processed by AI.</span>
        </div>
      )}
      
      {status === 'success_single' && (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-3 py-1.5 rounded-full text-sm">
          <CheckCircle className="h-4 w-4" />
          <span>One face detected. Ready to go!</span>
        </div>
      )}

      {status === 'success_multiple' && (
         <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-3 py-1.5 rounded-full text-sm text-center">
          <Users className="h-4 w-4" />
          <span>Multiple faces found. Tap to select.</span>
        </div>
      )}

      <div className={cn("w-full flex gap-2", { 'hidden': status !== 'idle' && status !== 'error' })}>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 min-w-0"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload a Photo
        </Button>
        <Button
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 min-w-0"
        >
          <Upload className="mr-2 h-4 w-4" />
          Take a Photo
        </Button>
      </div>
    </div>
  );
}

