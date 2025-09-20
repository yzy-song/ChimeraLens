'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ShareButtonProps {
  artworkUrl: string;
  title: string;
}

export function ShareButton({ artworkUrl, title }: ShareButtonProps) {
  const [isFallbackOpen, setFallbackOpen] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: title || '来看看我在 ChimeraLens 上的AI创作！',
      text: '快来试试这款超酷的AI换脸应用吧！',
      url: artworkUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('分享失败:', error);
      }
    } else {
      // 如果浏览器不支持，则显示后备UI
      setFallbackOpen(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(artworkUrl);
    toast.success('链接已复制到剪贴板！');
  };

  return (
    <>
      <Button onClick={handleShare}>
        <Share2 className="mr-2 h-5 w-5" />
        分享
      </Button>

      <Dialog open={isFallbackOpen} onOpenChange={setFallbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分享你的创作</DialogTitle>
            <DialogDescription>
              你的浏览器不支持原生分享，你可以复制下面的链接。
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input defaultValue={artworkUrl} readOnly />
            <Button onClick={copyToClipboard}>复制</Button>
          </div>
          <div className="mt-4 flex justify-center gap-4">
             <a 
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(artworkUrl)}&text=${encodeURIComponent(title)}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline"
            >
              分享到 Twitter
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
