'use client';

import { Template } from '@/hooks/use-templates';
import Image from 'next/image';
import { Crown } from 'lucide-react';
import { Card } from './ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TemplateGalleryProps {
  templates: Template[];
  isLoading: boolean;
  isError: boolean;
  onSelectTemplate: (template: Template) => void;
  selectedTemplateId?: string;
}

export function TemplateGallery({
  templates, isLoading, isError, onSelectTemplate, selectedTemplateId
}: TemplateGalleryProps) {

  // Skeleton Loader Logic
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex space-x-4 pb-4 overflow-x-auto p-2"> {/* Add padding for skeleton too */}
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) return <div className="text-red-500">Failed to load templates.</div>;

  return (
    <div className="w-full">
      {/* 1. Add horizontal padding (px-2) to the scrolling container */}
      <div className="flex space-x-4 pb-4 overflow-x-auto px-2">
        {templates.map((template) => (
          // 2. Add a margin (m-2) to the clickable container
          <div
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="flex-shrink-0 m-2" 
          >
            <Card className={`
              w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden cursor-pointer 
              transition-all duration-200 group relative
              ${selectedTemplateId === template.id ? 'ring-4 ring-blue-500' : 'ring-2 ring-transparent hover:ring-blue-400'}
            `}>
              {template.isPremium && (
                <div className="absolute top-1 right-1 z-10 rounded-full bg-yellow-500 p-1 text-white shadow-md">
                  <Crown className="h-3 w-3" />
                </div>
              )}
              <Image
                src={template.imageUrl}
                alt={template.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
                sizes="20vw"
              />
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-xs font-semibold truncate">{template.name}</p>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

