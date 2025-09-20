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
      title: title || 'Check out my AI creation on ChimeraLens!',
      text: 'Try this amazing AI face swap app!',
      url: artworkUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // If browser does not support native share, show fallback UI
      setFallbackOpen(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(artworkUrl);
    toast.success('Link copied to clipboard!');
  };

  return (
    <>
      <Button onClick={handleShare}>
        <Share2 className="mr-2 h-5 w-5" />
        Share
      </Button>

      <Dialog open={isFallbackOpen} onOpenChange={setFallbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Creation</DialogTitle>
            <DialogDescription>
              Your browser does not support native sharing. You can copy the link below.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input defaultValue={artworkUrl} readOnly />
            <Button onClick={copyToClipboard}>Copy</Button>
          </div>
          <div className="mt-4 flex justify-center gap-4">
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(artworkUrl)}&text=${encodeURIComponent(title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline"
            >
              Share on Twitter
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
