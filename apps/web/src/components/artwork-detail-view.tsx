'use client';

import { Generation } from '@chimeralens/db';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShareButton } from '@/components/share-button';
import { Download, ArrowLeft, Trash } from 'lucide-react';
import { useGenerationById } from '@/hooks/use-generation-by-id';
import { useDownloadGeneration } from '@/hooks/use-download-generation';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useUser } from '@/hooks/use-user'; 
import { useRouter } from 'next/navigation';
interface ArtworkDetailViewProps {
  id: string;
  initialData: Generation;
}

export default function ArtworkDetailView({ id, initialData }: ArtworkDetailViewProps) {
  const router = useRouter();

  const { data: userResponse } = useUser();
  const currentUser = userResponse?.data.user;

  const { data: response, isLoading, isError, error } = useGenerationById(id);

  const { download, isDownloading } = useDownloadGeneration();

  const [showError, setShowError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const generation = response?.data || initialData;

  const isOwner = currentUser && !currentUser.isGuest && currentUser.id === generation.userId;

  const handleDownload = () => {
    if (generation.id) {
      download(generation.id);
    }
  };

  const handleDelete = async () => {
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    setShowConfirm(false);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generations/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      // window.location.href = '/gallery';
      router.push('/gallery');
    } else {
      setShowError(true);
    }
  };

  if (isLoading) return <div>Loading artwork...</div>;
  if (isError) return <div className="text-red-500">Error: {error.message}</div>;
  if (!generation) return <div>Artwork not found.</div>;

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  let title = `My AI Creation #${generation.id.substring(0, 6)}`;
  if(!isOwner){
    title = `Created by User #${generation.userId?.substring(0, 6)}`;
  }

  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 p-4 border-b bg-background/80 backdrop-blur-sm flex justify-between items-center">
        <Button asChild variant="ghost">
          <Link href="/gallery" className="flex items-center">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Gallery
          </Link>
        </Button>
        <Link href="/" className="text-xl font-bold">
          ChimeraLens AI
        </Link>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full flex flex-col items-center gap-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        <Card className="w-full max-w-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-square">
              <Image
                src={generation.resultImageUrl}
                alt={`Generated image ${generation.id}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 90vw, (max-width: 1024px) 50vw, 640px"
                priority
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. 使用 isOwner 变量来条件渲染按钮组 */}
        <div className="flex items-center gap-4">
          {isOwner ? (
            <>
              <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
                <Download className="mr-2 h-5 w-5" />
                {isDownloading ? 'Preparing...' : 'Download'}
              </Button>
              <ShareButton artworkUrl={pageUrl} title={title} />
              <Button variant="destructive" onClick={handleDelete}>
                <Trash className="mr-2 h-5 w-5" />
                Delete
              </Button>
            </>
          ) : (
             <ShareButton artworkUrl={pageUrl} title={title} />
          )}
        </div>
      </main>
      {/* 删除确认模态框 */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Confirmation</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete this artwork? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 删除失败模态框 */}
      <Dialog open={showError} onOpenChange={setShowError}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Failed</DialogTitle>
          </DialogHeader>
          <div>Failed to delete this artwork. Please try again later or check your permissions.</div>
          <DialogFooter>
            <Button onClick={() => setShowError(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
