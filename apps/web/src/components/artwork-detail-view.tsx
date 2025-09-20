'use client';

import { Generation } from '@chimeralens/db';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShareButton } from '@/components/share-button';
import { Download, ArrowLeft } from 'lucide-react';
import { useGenerationById } from '@/hooks/use-generation-by-id';

interface ArtworkDetailViewProps {
  id: string;
  initialData: Generation;
}

export default function ArtworkDetailView({ id, initialData }: ArtworkDetailViewProps) {
  // 我们使用来自服务器的 initialData，但 React Query 会在客户端接管状态管理
  const { data: response, isLoading, isError, error } = useGenerationById(id);

  const generation = response?.data || initialData;

  const handleDownload = () => {
    if (generation.resultImageUrl) {
      const link = document.createElement('a');
      link.href = generation.resultImageUrl;
      link.download = `chimeralens-${generation.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) return <div>加载作品中...</div>;
  if (isError) return <div className="text-red-500">错误: {error.message}</div>;
  if (!generation) return <div>作品未找到。</div>;

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const title = `我的 AI 创作 #${generation.id.substring(0, 6)}`;


  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
       <header className="sticky top-0 z-50 p-4 border-b bg-background/80 backdrop-blur-sm flex justify-between items-center">
        <Button asChild variant="ghost">
          <Link href="/gallery" className="flex items-center">
            <ArrowLeft className="mr-2 h-5 w-5" />
            返回作品集
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
                  alt={`生成的图片 ${generation.id}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 90vw, (max-width: 1024px) 50vw, 640px"
                  priority
                />
              </div>
          </CardContent>
        </Card>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-5 w-5" />
            下载
          </Button>
          <ShareButton artworkUrl={pageUrl} title={title} />
        </div>
      </main>
    </div>
  );
}
