// apps/api/src/templates/templates.data.ts

export interface Template {
  id: string;
  name: string;
  style: string;
  imageUrl: string;
}

export const TEMPLATES_DATA: Template[] = [
  {
    id: 'template-001',
    name: 'Cyberpunk Sentinel',
    style: 'Cyberpunk',
    imageUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop',
  },
  {
    id: 'template-002',
    name: 'Medieval Knight',
    style: 'Medieval',
    imageUrl:
      'https://images.unsplash.com/photo-1569913486515-b74bf7751574?q=80&w=1887&auto=format&fit=crop',
  },
  {
    id: 'template-003',
    name: 'Galactic Explorer',
    style: 'Sci-Fi',
    imageUrl:
      'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?q=80&w=1887&auto=format&fit=crop',
  },
  {
    id: 'template-004',
    name: 'Renaissance Portrait',
    style: 'Oil Painting',
    imageUrl:
      'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=1780&auto=format&fit=crop',
  },
  // 你可以在这里添加更多你用 Midjourney 生成的模板图片 URL
];
