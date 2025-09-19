'use client';

import { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@/hooks/use-user';
import { TemplateGallery } from '@/components/template-gallery';
import { Template } from '@/hooks/use-templates';
import { ImageUploader } from '@/components/image-uploader';
import { useGeneration } from '@/hooks/use-generation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserNav } from '@/components/user-nav';
import { useTemplates } from '@/hooks/use-templates';
import { Wand2, Crown, Download } from 'lucide-react'; // 新增下载图标
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'; // 1. 导入 ScrollArea 和 ScrollBar
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; // 2. 导入 Tabs 组件

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All'); // 3. 仍然保留 activeCategory 状态

  const { data: userResponse, refetch: refetchUser } = useUser();
  const user = userResponse?.data.user;
  const { mutate: generate, data: generationResponse, isPending, isError, error, isSuccess } = useGeneration();
  const { data: templatesResponse, isLoading: areTemplatesLoading, isError: areTemplatesError } = useTemplates();

  const allTemplates = templatesResponse?.data || [];
  const categories = ['All', ...Array.from(new Set(allTemplates.map(t => t.style)))]; // 获取所有分类

  const filteredTemplates = activeCategory === 'All'
    ? allTemplates
    : allTemplates.filter(t => t.style === activeCategory);

  useEffect(() => {
    if (isError) toast.error(error.message);
    if (isSuccess) {
      toast.success('Image generated successfully!');
      refetchUser();
      // 生成成功后，可以滚动到结果区域 (如果需要的话，目前保持在底部)
    }
  }, [isError, isSuccess, error, refetchUser]);

  useEffect(() => {
    setIsClient(true);
    if (!localStorage.getItem('guestId')) {
      localStorage.setItem('guestId', uuidv4());
    }
  }, []);

  const handleGenerateClick = () => {
    if (!sourceFile || !selectedTemplate) {
      toast.warning('Please select a template and upload your photo first.');
      return;
    }
    if (user && user.credits <= 0) {
      toast.error("You don't have enough credits.");
      return;
    }
    generate({
      sourceImage: sourceFile,
      templateId: selectedTemplate.id,
      modelKey: 'stable-swap-v1',
    });
  };

  // 下载图片方法
  const handleDownload = () => {
    if (generationResult?.resultImageUrl) {
      const link = document.createElement('a');
      link.href = generationResult.resultImageUrl;
      link.download = 'chimera_result.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const generationResult = generationResponse?.data;

  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* --- Header (顶部导航栏) --- */}
      <header className="sticky top-0 z-50 p-4 border-b bg-background/80 backdrop-blur-sm flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Image
            src="https://placehold.co/40x40?text=Logo"
            alt="Logo"
            width={40}
            height={40}
            className="rounded"
          />
          <span className="text-lg font-semibold text-primary">One-click to another you</span>
        </div>
        <div className='flex items-center gap-4'>
          {isClient && (
            <div className="flex items-center px-3 py-2 border rounded-full text-sm font-semibold bg-gray-200 dark:bg-gray-700">
              ✨ {user?.credits ?? '...'}
            </div>
          )}
          {isClient && <UserNav/>}
        </div>
      </header>

      {/* --- Main Content Area --- */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8 pb-24 lg:pb-8"> {/* 5. 底部留出空间给固定按钮 */}
        {/* --- 左侧/顶部：操作面板 (模板选择 & 图片上传) --- */}
        <div className="flex flex-col lg:w-1/2 gap-6 order-2 lg:order-1"> {/* 移动端上下布局，lg端左右布局 */}
          {/* 6. 模板选择区域 - 使用 Tabs 组件融合分类和画廊 */}
          <Card className="flex-grow">
            <CardHeader>
              <CardTitle>1. Choose a Style</CardTitle>
              <CardDescription>Select a template from our curated collections.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                <ScrollArea className="max-w-full pb-2"> {/* 7. 用 ScrollArea 包裹 TabsList */}
                  <TabsList className="flex w-full justify-start md:justify-center">
                    {categories.map((category) => (
                      <TabsTrigger key={category} value={category} className="whitespace-nowrap">
                        {category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
                
                <div className="mt-4">
                  {/* TemplateGallery 保持不变，它只显示过滤后的模板 */}
                  <TemplateGallery
                    templates={filteredTemplates}
                    isLoading={areTemplatesLoading}
                    isError={areTemplatesError}
                    selectedTemplateId={selectedTemplate?.id}
                    onSelectTemplate={setSelectedTemplate}
                  />
                </div>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* 8. 图片上传区域 */}
          <Card className="flex-grow">
            <CardHeader>
              <CardTitle>2. Upload Your Photo</CardTitle>
              <CardDescription>We recommend a clear, front-facing portrait. </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader onFileSelect={setSourceFile} />
            </CardContent>
          </Card>
        </div>

        {/* --- 右侧/底部：结果展示区 (画布) --- */}
        <div className="lg:w-1/2 flex flex-col gap-4 order-1 lg:order-2"> {/* 移动端上下布局，lg端左右布局 */}
          <Card className="w-full flex-grow aspect-square lg:sticky lg:top-24"> {/* 9. 桌面端固定在顶部 */}
            <CardContent className="flex items-center justify-center h-full p-2">
              {isPending && (
                <div className="flex flex-col items-center justify-center gap-4 text-center w-full">
                  <div className="relative w-32 h-32">
                    {sourceFile && <Image src={URL.createObjectURL(sourceFile)} alt="Source" layout="fill" className="object-cover rounded-full animate-pulse" />}
                    {selectedTemplate && <Image src={selectedTemplate.imageUrl} alt="Template" layout="fill" className="object-cover rounded-lg animate-ping opacity-75" />}
                  </div>
                  <p className="text-muted-foreground animate-pulse mt-4">Generating, please wait (~30s)...</p>
                </div>
              )}
              {isError && <p className="text-destructive p-4">Error: {error.message}</p>}
              {generationResult && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <Image src={generationResult.resultImageUrl} alt="Generated result" width={512} height={512} className="object-contain rounded-md"/>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={handleDownload}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    下载图片
                  </Button>
                </div>
              )}
              {!isPending && !isError && !generationResult && <p className="text-muted-foreground p-4 text-center">Your masterpiece will appear here!</p>}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* --- Fixed Generate Button (固定在底部) --- */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/80 backdrop-blur-sm border-t lg:hidden"> {/* 10. 只在移动端显示 */}
        <Button 
          onClick={handleGenerateClick}
          disabled={!selectedTemplate || !sourceFile || isPending}
          size="lg"
          className="w-full h-14 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg hover:scale-105 transition-transform"
        >
          <Wand2 className="mr-2 h-6 w-6" />
          {isPending ? 'Creating Magic...' : 'Generate Image'}
        </Button>
      </div>

      {/* 桌面端 Generate 按钮，跟随内容滚动 */}
      <div className="hidden lg:block fixed bottom-4 right-8 z-40"> 
         <Button 
          onClick={handleGenerateClick}
          disabled={!selectedTemplate || !sourceFile || isPending}
          size="lg"
          className="h-16 px-8 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg hover:scale-105 transition-transform"
        >
          <Wand2 className="mr-2 h-6 w-6" />
          {isPending ? 'Creating Magic...' : 'Generate Image'}
        </Button>
      </div>
    </div>
  );
}