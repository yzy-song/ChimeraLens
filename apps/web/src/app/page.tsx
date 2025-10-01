'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@/hooks/use-user';
import { TemplateGallery } from '@/components/template-gallery';
import { Template } from '@/hooks/use-templates';
import { ImageUploader, ImageUploaderResult } from '@/components/image-uploader';
import { useGeneration } from '@/hooks/use-generation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserNav } from '@/components/user-nav';
import { useTemplates } from '@/hooks/use-templates';
import { Wand2, Download } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useDownloadGeneration } from '@/hooks/use-download-generation';

const funnyLoadingTexts = [
  'Reticulating splines...',
  'Generating witty dialog...',
  'Swapping time and space...',
  'Consulting with ancient spirits...',
  'Painting pixels...',
  'Polishing the pixels...',
  'Aligning cosmic rays...',
];

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  // --- 核心改动 1: 状态类型从 File | null 变为更丰富的 ImageUploaderResult | null ---
  const [sourceData, setSourceData] = useState<ImageUploaderResult | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loadingText, setLoadingText] = useState(funnyLoadingTexts[0]);
  const [progress, setProgress] = useState(0);

  const { data: userResponse, refetch: refetchUser } = useUser();
  const user = userResponse?.data.user;
  const { mutate: generate, data: generationResponse, isPending, isError, error, isSuccess } = useGeneration();
  const { data: templatesResponse, isLoading: areTemplatesLoading, isError: areTemplatesError } = useTemplates();
  const { download, isDownloading } = useDownloadGeneration();

  const allTemplates = templatesResponse?.data || [];
  const categories = ['All', ...Array.from(new Set(allTemplates.map(t => t.style)))];

  const filteredTemplates = activeCategory === 'All'
    ? allTemplates
    : allTemplates.filter(t => t.style === activeCategory);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPending) {
      interval = setInterval(() => {
        setLoadingText(funnyLoadingTexts[Math.floor(Math.random() * funnyLoadingTexts.length)]);
        setProgress(p => (p < 90 ? p + 5 : p));
      }, 1500);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [isPending]);


  useEffect(() => {
    if (isError) toast.error(error.message);
    if (isSuccess) {
      toast.success('Image generated successfully!');
      refetchUser();
    }
  }, [isError, isSuccess, error, refetchUser]);

  useEffect(() => {
    setIsClient(true);
    if (!localStorage.getItem('guestId')) {
      localStorage.setItem('guestId', uuidv4());
    } else {  
      console.log('Existing guestId:', localStorage.getItem('guestId'));
    }
  }, []);

  const handleGenerateClick = () => {
    // --- 核心改动 2: 判断 sourceData.file 是否存在 ---
    if (!sourceData?.file || !selectedTemplate) {
      toast.warning('Please select a template and upload your photo first.');
      return;
    }
    if (user && user.credits <= 0) {
      toast.error("You don't have enough credits.");
      return;
    }
    setProgress(0);
    generate({
      sourceImage: sourceData.file,
      templateId: selectedTemplate.id,
      modelKey: 'stable-swap-v1',
      faceSelection: sourceData.faceSelection,
    });
  };

  const generationResult = generationResponse?.data;

  return (
    <div className="w-full min-h-screenbg-background flex flex-col">
      <header className="sticky top-0 z-50 p-4 border-b bg-background/80 backdrop-blur-sm flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="Logo"
            width={40}
            height={40}
            className="rounded"
          />
          <span
            className="text-lg font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
          >
            One-click to another you
          </span>
        </div>
        <div className="flex items-center gap-4">
          {isClient && (
            <div className="flex sm:hidden items-center px-2 py-1 border rounded-full text-xs font-semibold bg-secondary">
              <span className="mr-1">✨</span> {user?.credits ?? <Skeleton className="w-4 h-4 inline-block" />}
            </div>
          )}
          {isClient && (
            <div className="hidden sm:flex items-center px-3 py-1.5 border rounded-full text-sm font-semibold bg-secondary">
              <span className="mr-2">✨</span> {user?.credits ?? <Skeleton className="w-4 h-4 inline-block" />}
            </div>
          )}
          {isClient && <UserNav />}
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8 pb-24 lg:pb-8">
        <div className="flex flex-col lg:w-1/2 gap-6 order-1 lg:order-2">
          <Card className="flex-grow">
            <CardHeader>
              <CardTitle>1. Choose a Style</CardTitle>
              <CardDescription>Select a template from our curated collections.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                <ScrollArea className="max-w-full pb-2">
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
          
          <Card className="flex-grow">
            <CardHeader>
              <CardTitle>2. Upload Your Photo</CardTitle>
              <CardDescription>We recommend a clear, front-facing portrait. </CardDescription>
            </CardHeader>
            <CardContent>
              {/* --- 核心改动 4: 将 onFileSelect 的 prop 改为 onFileSelect={setSourceData} --- */}
              <ImageUploader onFileSelect={setSourceData} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:w-1/2 flex flex-col gap-4 order-2 lg:order-1">
          <Card className="w-full flex-grow aspect-square lg:sticky lg:top-24">
            <CardContent className="flex items-center justify-center h-full p-2">
              {isPending && (
                <div className="flex flex-col items-center justify-center gap-4 text-center w-full px-4">
                   <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 1s ease-in-out' }}></div>
                  </div>
                  <p className="text-muted-foreground animate-pulse mt-2">{loadingText}</p>
                </div>
              )}
              {isError && <p className="text-destructive p-4">Error: {error.message}</p>}
              
              {generationResult && !isPending && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <Image src={generationResult.resultImageUrl} alt="Generated result" width={512} height={512} className="object-contain rounded-md"/>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => download(generationResult.id)}
                    disabled={isDownloading}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    {isDownloading ? 'Downloading...' : 'Download Image'}
                  </Button>
                </div>
              )}

              {!isPending && !isError && !generationResult && <p className="text-muted-foreground p-4 text-center">Your masterpiece will appear here!</p>}
            </CardContent>
          </Card>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/80 backdrop-blur-sm border-t lg:hidden">
        <Button 
          onClick={handleGenerateClick}
          disabled={!selectedTemplate || !sourceData?.file || isPending}
          size="lg"
          className="w-full h-14 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg hover:scale-105 transition-transform"
        >
          <Wand2 className="mr-2 h-6 w-6" />
          {isPending ? 'Creating Magic...' : 'Generate Image'}
        </Button>
      </div>

      <div className="hidden lg:block fixed bottom-4 right-8 z-40"> 
         <Button 
          onClick={handleGenerateClick}
          disabled={!selectedTemplate || !sourceData?.file || isPending}
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

