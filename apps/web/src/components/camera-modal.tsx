// apps/web/src/components/camera-modal.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Camera, Check, RefreshCw, X, Repeat } from 'lucide-react';

import { toast } from 'sonner';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCapture: (file: File) => void;
}

// Data URL to File converter
async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}

export function CameraModal({ isOpen, onClose, onPhotoCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  // 1. 新增 state 来管理视图：实时取景 vs. 拍照后预览
  const [view, setView] = useState<'live' | 'preview'>('live');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };
  
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setError(null);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      // 2. 更详细的错误处理
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please enable it in your browser/system settings.');
        toast.error('Camera permission denied.');
      } else {
        setError('Camera not available. It might be in use by another app.');
        toast.error('Camera not available.');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, facingMode]);
  
  // 3. 拍照逻辑更新：不再直接返回，而是进入预览视图
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedImage(dataUrl);
        setView('preview'); // 切换到预览视图
        stopStream(); // 拍照后停止视频流，节省资源
      }
    }
  };
  
  // 4. 新增“重拍”和“使用照片”的处理函数
  const handleRetake = () => {
    setCapturedImage(null);
    setView('live');
    startCamera(); // 重新启动相机
  };

  const handleUsePhoto = async () => {
    if (capturedImage) {
      const photoFile = await dataUrlToFile(capturedImage, `photo-${Date.now()}.jpg`);
      onPhotoCapture(photoFile);
      onClose();
    }
  };
  
  // 在关闭弹窗时，重置视图状态
  const handleClose = () => {
    setView('live');
    setCapturedImage(null);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="p-0 border-0 bg-black w-screen h-dvh rounded-none top-0 left-0 translate-x-0 translate-y-0 data-[state=open]:animate-none md:max-w-lg md:h-auto md:aspect-square md:rounded-lg md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:data-[state=open]:animate-in">
            <DialogHeader className="sr-only"><DialogTitle>Take a Photo</DialogTitle></DialogHeader>

        <div className="relative w-full h-full flex items-center justify-center">
          {error ? (
            <div className="flex flex-col items-center justify-center w-full h-full text-white">
              <p className="mb-4">{error}</p>
              <Button onClick={handleClose} className="bg-red-500 hover:bg-red-600 text-white">关闭</Button>
            </div>
          ) : (
            <>
              {/* 根据视图状态，决定显示实时视频还是预览图 */}
              <video ref={videoRef} autoPlay playsInline muted 
                className={`w-full h-full object-cover ${view === 'preview' ? 'hidden' : 'block'}`} />
              
              {capturedImage && view === 'preview' && (
                <img src={capturedImage} alt="Captured preview" className="w-full h-full object-contain" />
              )}
              <canvas ref={canvasRef} className="hidden" />
              
              {/* 5. 根据视图状态，显示不同的控制按钮 */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-6">
                {view === 'live' && (
                  <div className="flex items-center justify-around">
                    {/* 2. 左侧用一个占位符来保持拍照按钮居中 */}
                    <div className="w-20 h-20" /> 
                    
                    {/* 3. 中心拍照按钮 */}
                    <Button onClick={handleCapture} disabled={!stream} size="lg" className="w-20 h-20 rounded-full bg-white text-gray-900 hover:bg-gray-200 shadow-lg">
                      <Camera className="h-10 w-10" />
                    </Button>

                    {/* 4. 切换摄像头按钮，增大尺寸并更换图标 */}
                    <Button onClick={() => setFacingMode(p => p === 'user' ? 'environment' : 'user')} disabled={!stream} variant="ghost" size="icon" className="text-white bg-black/20 hover:bg-black/40 rounded-full w-14 h-14">
                      <Repeat className="h-8 w-8" />
                    </Button>
                  </div>
                )}
                {view === 'preview' && (
                   <div className="flex items-center justify-between">
                    <Button onClick={handleRetake} variant="ghost" size="lg" className="text-white text-lg"><RefreshCw className="mr-2 h-6 w-6"/>Retake</Button>
                    <Button onClick={handleUsePhoto} size="lg" className="bg-green-500 hover:bg-green-600 text-white text-lg"><Check className="mr-2 h-6 w-6"/>Use Photo</Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}