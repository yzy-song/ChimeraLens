import { api } from '@/lib/api';
import { Generation } from '@chimeralens/db';
import { ApiResponse } from '@/types';
import { Metadata } from 'next';
import ArtworkDetailView from '@/components/artwork-detail-view'; // 导入客户端组件

// 这个函数在服务端获取数据
async function getGeneration(id: string): Promise<Generation | null> {
  try {
    // 我们需要直接使用 fetch，因为封装的 api 实例包含客户端拦截器
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generations/${id}`);
    if (!response.ok) {
        return null;
    }
    const result: ApiResponse<Generation> = await response.json();
    return result.data;
  } catch (error) {
    console.error("在服务端获取作品失败:", error);
    return null;
  }
}

// 这个函数为页面动态生成元数据
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const generation = await getGeneration(params.id);

  if (!generation) {
    return {
      title: '作品未找到 | ChimeraLens',
    };
  }

  const title = `我的 AI 创作 #${generation.id.substring(0, 6)} | ChimeraLens`;
  const description = '来看看我用ChimeraLens创作的超酷图片！';

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: generation.resultImageUrl,
          width: 512,
          height: 512,
          alt: '生成的 AI 作品',
        },
      ],
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/gallery/${generation.id}`,
      siteName: 'ChimeraLens',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [generation.resultImageUrl],
    },
  };
}

// 页面组件本身
export default async function ArtworkPage({ params }: { params: { id: string } }) {
  const { id } = await params; // 这里需要 await

  const generation = await getGeneration(id);

  if (!generation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-4xl font-bold mb-4">作品未找到</h1>
        <p>您要查找的作品不存在或已被删除。</p>
      </div>
    );
  }

  return <ArtworkDetailView id={id} initialData={generation} />;
}

