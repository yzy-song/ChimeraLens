'use client';

import { Template } from '@/hooks/use-templates';
import Image from 'next/image';
import { Crown } from 'lucide-react';

// 定义组件的 props 类型
interface TemplateGalleryProps {
  templates: Template[]; // 直接接收模板数组
  isLoading: boolean;
  isError: boolean;
  onSelectTemplate: (template: Template) => void;
  selectedTemplateId?: string;
}

export function TemplateGallery({
  templates,
  isLoading,
  isError,
  onSelectTemplate,
  selectedTemplateId
}: TemplateGalleryProps) {

  if (isLoading) {
    return <div className="text-center">Loading templates...</div>;
  }

  if (isError) {
    return <div className="text-center text-red-500">Failed to load templates.</div>;
  }

  return (
    <div className="w-full max-w-4xl">
      <h2 className="text-2xl font-bold mb-4 text-center">1. Choose a Template</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className={`
              relative w-full aspect-square rounded-lg overflow-hidden cursor-pointer 
              transition-all duration-200
              ${selectedTemplateId === template.id ? 'ring-4 ring-blue-500' : 'ring-2 ring-transparent hover:ring-blue-400'}
            `}
          >
            {template.isPremium && (
              <div className="absolute top-2 right-2 z-10 rounded-full bg-yellow-500 p-1.5 text-white">
                <Crown className="h-4 w-4" />
              </div>
            )}
            <Image
              src={template.imageUrl}
              alt={template.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-sm font-semibold truncate">{template.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}