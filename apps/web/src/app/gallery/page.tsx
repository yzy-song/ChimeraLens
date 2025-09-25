'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useGenerations } from '@/hooks/use-generations';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Generation } from '@chimeralens/db';
import { Skeleton } from '@/components/ui/skeleton'; // 导入骨架屏组件
import { Trash, Download } from 'lucide-react';

export default function GalleryPage() {
  const [page, setPage] = useState(1);
  const limit = 8;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: response, isLoading, isError, error } = useGenerations({ page, limit });

  // 在加载完成前，generations 可能为 undefined，提供一个空数组作为默认值
  const generations: Generation[] = Array.isArray(response?.data) ? response.data : [];
  const meta = response?.meta;
  
  const renderSkeletons = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: limit }).map((_, index) => (
         <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <Skeleton className="w-full h-full" />
              </div>
            </CardContent>
          </Card>
      ))}
    </div>
  );

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(checked
      ? [...selectedIds, id]
      : selectedIds.filter(itemId => itemId !== id)
    );
  };

  const handleBatchDelete = async () => {
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    setShowConfirm(false);
    for (const id of selectedIds) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
    }
    window.location.reload();
  };

  const handleBatchDownload = () => {
    for (const id of selectedIds) {
      window.open(`${process.env.NEXT_PUBLIC_API_URL}/generations/${id}/download`, '_blank');
    }
  };

  return (
    <div className="w-full min-h-screen bg-background">
      <header className="p-4 border-b bg-background sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            ChimeraLens AI
          </Link>
          <Button asChild variant="secondary">
            <Link href="/">Back to Generator</Link>
          </Button>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Creations</h1>

        {isLoading && renderSkeletons()}
        {isError && <p className="text-red-500">Error: {error.message}</p>}

        {!isLoading && generations.length === 0 && (
          <p>You haven&#39;t created any images yet. <Link href="/" className="text-blue-500 hover:underline">Start creating now!</Link></p>
        )}

        {!isLoading && generations.length > 0 && (
          <>
            <div className="flex gap-2 mb-4">
              <button
                className="px-4 py-2 rounded bg-red-600 text-white flex items-center gap-2"
                disabled={selectedIds.length === 0}
                onClick={handleBatchDelete}
              >
                <Trash className="h-5 w-5" />
                Delete Selected
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white flex items-center gap-2"
                disabled={selectedIds.length === 0}
                onClick={handleBatchDownload}
              >
                <Download className="h-5 w-5" />
                Download Selected
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {generations.map((gen) => (
                <div key={gen.id} className="relative group">
                  <input
                    type="checkbox"
                    className="absolute top-2 left-2 z-10"
                    checked={selectedIds.includes(gen.id)}
                    onChange={e => handleSelect(gen.id, e.target.checked)}
                  />
                  <Link href={`/gallery/${gen.id}`} passHref>
                    <Card className="overflow-hidden transition-transform hover:scale-105">
                      <CardContent className="p-0">
                        <div className="relative aspect-square">
                          <Image
                            src={gen.resultImageUrl}
                            alt="Generated image"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Controls */}
        {meta && meta.total > limit && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button onClick={() => setPage(page - 1)} disabled={page === 1}>
              Previous
            </Button>
            <span>Page {meta.page} of {meta.lastPage}</span>
            <Button onClick={() => setPage(page + 1)} disabled={page === meta.lastPage}>
              Next
            </Button>
          </div>
        )}
      </main>
      {/* 删除确认模态框 */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Confirmation</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete the selected artworks? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
