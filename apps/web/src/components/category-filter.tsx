'use client';

import { Template } from '@/hooks/use-templates';
import { Button } from './ui/button';

interface CategoryFilterProps {
  templates: Template[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ templates, activeCategory, onCategoryChange }: CategoryFilterProps) {
  // 从所有模板数据中，自动提取出所有不重复的分类
  const categories = ['All', ...Array.from(new Set(templates.map(t => t.style)))];

  return (
    <div className="w-full max-w-4xl overflow-x-auto pb-2">
      <div className="flex items-center justify-center space-x-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={activeCategory === category ? 'default' : 'outline'}
            onClick={() => onCategoryChange(category)}
            className="whitespace-nowrap"
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}