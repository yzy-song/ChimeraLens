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
import { Wand2, Download } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';

// Array of loading messages
const loadingMessages = [
  "Reticulating splines...",
  "Calibrating flux capacitors...",
  "Fusing light and shadow...",
  "Painting pixels...",
  "Consulting the digital oracle...",
  "Warming up the AI artist...",
  "Almost there, adding the final touches...",
];

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // States for generation visualization
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: userResponse, refetch: refetchUser } = useUser();
  const user = userResponse?.data.user;
  const { mutate: generate, data: generationResponse, isPending, isError, error, isSuccess } = useGeneration();
  const { data: templatesResponse, isLoading: areTemplatesLoading, isError: areTemplatesError } = useTemplates();

  const allTemplates = templatesResponse?.data || [];
  const categories = ['All', ...Array.from(new Set(allTemplates.map(t => t.style)))];

  const filteredTemplates = activeCategory === 'All'
    ? allTemplates
    : allTemplates.filter(t => t.style === activeCategory);

  useEffect(() => {
    if (isPending) {
      // Start progress simulation
      setProgress(0);
      setLoadingMessage(loadingMessages[0]);
      let currentProgress = 0;
      progressIntervalRef.current = setInterval(() => {
        currentProgress += 1;
        setProgress(currentProgress);
        if (currentProgress >= 95 && progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }, 300); // ~30 seconds to reach 95%

      // Start rotating messages
      let messageIndex = 0;
      messageIntervalRef.current = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 3000);
    } else {
      // Clean up intervals when not pending
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    }
  }, [isPending]);
  
  useEffect(() => {
    if (isError) {
      // Use the specific error message from the backend
      toast.error(error.message || 'An unknown error occurred.');
    }
    if (isSuccess) {
      setProgress(100); // Complete the progress bar
      toast.success('Image generated successfully!');
      refetchUser();
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
      // modelKey: 'sepehr-mirage',
      // modelKey: 'pikachu-faceswap',
    });
  };

  const handleDownload = () => {
    if (generationResult?.resultImageUrl) {
      const link = document.createElement('a');
      link.href = generationResult.resultImageUrl;
      link.download = `chimeralens-result-${generationResult.id.substring(0,6)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const generationResult = generationResponse?.data;

  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* --- Header --- */}
      <header className="sticky top-0 z-50 p-4 border-b bg-background/80 backdrop-blur-sm flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Image
                src="https://placehold.co/40x40/7c3aed/ffffff?text=CL"
                alt="Logo"
                width={40}
                height={40}
                className="rounded-md"
              />
          </Link>
          <span className="text-lg font-semibold text-primary hidden sm:inline">ChimeraLens AI</span>
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
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8 pb-24 lg:pb-8">
        {/* --- Left Panel --- */}
        <div className="flex flex-col lg:w-1/2 gap-6 order-2 lg:order-1">
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
              <ImageUploader onFileSelect={setSourceFile} />
            </CardContent>
          </Card>
        </div>

        {/* --- Right Panel --- */}
        <div className="lg:w-1/2 flex flex-col gap-4 order-1 lg:order-2">
          <Card className="w-full flex-grow aspect-square lg:sticky lg:top-24">
            <CardContent className="flex items-center justify-center h-full p-2">
              {isPending && (
                <div className="flex flex-col items-center justify-center gap-4 text-center w-full p-4">
                    <div className="relative w-32 h-32">
                        {sourceFile && <Image src={URL.createObjectURL(sourceFile)} alt="Source" layout="fill" className="object-cover rounded-full animate-pulse opacity-50" />}
                        {selectedTemplate && <Image src={selectedTemplate.imageUrl} alt="Template" layout="fill" className="object-cover rounded-lg animate-ping opacity-25" />}
                    </div>
                    <div className="w-full max-w-xs">
                        <p className="text-sm text-muted-foreground mb-2 animate-pulse">{loadingMessage}</p>
                        <div className="w-full bg-muted rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>
              )}
              {isError && !isPending && <p className="text-destructive p-4 text-center">Generation Failed. <br/> {error.message}</p>}
              {isSuccess && generationResult && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <Image src={generationResult.resultImageUrl} alt="Generated result" width={512} height={512} className="object-contain rounded-md"/>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={handleDownload}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download Image
                  </Button>
                </div>
              )}
              {!isPending && !isSuccess && !isError && <p className="text-muted-foreground p-4 text-center">Your masterpiece will appear here!</p>}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* --- Floating Generate Button --- */}
       <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/80 backdrop-blur-sm border-t lg:static lg:p-0 lg:border-0 lg:bg-transparent">
        <div className="lg:fixed lg:bottom-4 lg:right-8">
            <Button 
                onClick={handleGenerateClick}
                disabled={!selectedTemplate || !sourceFile || isPending}
                size="lg"
                className="w-full h-14 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg hover:scale-105 transition-transform lg:w-auto lg:h-16 lg:px-8"
            >
                <Wand2 className="mr-2 h-6 w-6" />
                {isPending ? 'Creating Magic...' : 'Generate Image'}
            </Button>
        </div>
      </div>
    </div>
  );
}
