'use client';

import { useEffect, useState } from 'react';
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
import { Wand2, Download, Sparkles } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDownloadGeneration } from '@/hooks/use-download-generation';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth.store';

const generationTips = [
  "Reticulating splines...",
  "Polishing pixels...",
  "Consulting the digital oracle...",
  "Warming up the AI's imagination...",
  "Blending light and shadow...",
  "Painting with neural brushes...",
  "Summoning creative energies...",
];

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [currentTip, setCurrentTip] = useState(generationTips[0]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'ready'>('idle');


  const { data: userResponse, refetch: refetchUser } = useUser();
  const user = userResponse?.data.user;
  const { mutate: generate, data: generationResponse, isPending, isError, error, isSuccess, reset: resetGeneration } = useGeneration();
  const { data: templatesResponse, isLoading: areTemplatesLoading, isError: areTemplatesError } = useTemplates();
  const { download, isDownloading } = useDownloadGeneration();

  const allTemplates = templatesResponse?.data || [];
  const categories = ['All', ...Array.from(new Set(allTemplates.map(t => t.style)))];
  const filteredTemplates = activeCategory === 'All' ? allTemplates : allTemplates.filter(t => t.style === activeCategory);

  useEffect(() => {
    setIsClient(true);
    if (!localStorage.getItem('guestId') && !useAuthStore.getState().token) {
      localStorage.setItem('guestId', uuidv4());
    }
  }, []);

  useEffect(() => {
    if (isPending) {
      const tipInterval = setInterval(() => {
        setCurrentTip(generationTips[Math.floor(Math.random() * generationTips.length)]);
      }, 3000);
      const progressInterval = setInterval(() => {
        setProgress(p => (p < 95 ? p + 2 : p));
      }, 500);
      return () => {
        clearInterval(tipInterval);
        clearInterval(progressInterval);
      };
    } else {
      setProgress(0);
      setCurrentTip(generationTips[0]);
    }
  }, [isPending]);

  useEffect(() => {
    if (isError) toast.error(error.message);
    if (isSuccess) {
      toast.success('Image generated successfully!');
      refetchUser();
      setProgress(100);
    }
  }, [isError, isSuccess, error, refetchUser]);


  const handleGenerateClick = () => {
    if (!sourceFile || !selectedTemplate) {
      toast.warning('Please select a template and upload a valid photo first.');
      return;
    }
    if (user && user.credits <= 0) {
      toast.error("You don't have enough credits.");
      return;
    }
    resetGeneration();
    setProgress(1);
    generate({
      sourceImage: sourceFile,
      templateId: selectedTemplate.id,
      modelKey: 'stable-swap-v1', // This could be dynamic in the future
    });
  };
  
  const generationResult = generationResponse?.data;
  
  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 p-4 border-b bg-background/80 backdrop-blur-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-500" />
          <span className="text-xl font-bold tracking-tighter">ChimeraLens</span>
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
      
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-gray-900 dark:text-gray-100">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
              Reimagine Yourself with AI
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Swap your face into stunning artistic templates. Upload your photo, choose a style, and let our AI create your new persona in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <Card className="shadow-lg border-purple-500/10">
              <CardHeader>
                <CardTitle className="flex items-center text-xl tracking-tight">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground mr-3 font-bold">1</span>
                  Choose a Style
                </CardTitle>
                <CardDescription>Select a template from our curated collections.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                  <ScrollArea className="w-full whitespace-nowrap rounded-md">
                    <TabsList className="inline-flex h-auto">
                      {categories.map((category) => (
                        <TabsTrigger key={category} value={category} className="px-4 py-2">
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

            <Card className="shadow-lg border-blue-500/10">
              <CardHeader>
                <CardTitle className="flex items-center text-xl tracking-tight">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground mr-3 font-bold">2</span>
                  Upload Your Photo
                </CardTitle>
                <CardDescription>A clear, front-facing portrait works best.</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader onFileSelect={(file) => {
                  setSourceFile(file);
                  setStatus(file ? 'ready' : 'idle');
                }} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <div className="sticky top-24">
              <Card className="aspect-square w-full shadow-2xl bg-black/20 border-purple-500/20">
                <CardContent className="flex items-center justify-center h-full p-2 relative overflow-hidden">
                  {isPending && (
                    <div className="flex flex-col items-center justify-center gap-4 text-center w-full p-4">
                      <div className="relative w-48 h-48">
                        {sourceFile && <Image src={URL.createObjectURL(sourceFile)} alt="Source" layout="fill" className="object-cover rounded-full animate-pulse opacity-50" />}
                        {selectedTemplate && <Image src={selectedTemplate.imageUrl} alt="Template" layout="fill" className="object-cover rounded-lg animate-ping opacity-30" />}
                      </div>
                      <div className="w-full max-w-sm mt-4">
                         <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                         </div>
                         <p className="text-muted-foreground animate-pulse mt-2 text-sm">{currentTip}</p>
                      </div>
                    </div>
                  )}

                  {isError && !isPending && (
                    <div className="text-center p-4">
                      <p className="text-destructive font-semibold">Generation Failed</p>
                      <p className="text-muted-foreground text-sm mb-4">{error.message}</p>
                      <Button onClick={handleGenerateClick}>Try Again</Button>
                    </div>
                  )}
                  
                  {generationResult && !isPending && (
                    <div className="flex flex-col items-center gap-4 w-full h-full p-2">
                      <div className="relative w-full h-full flex-grow">
                        <Image src={generationResult.optimizedUrl} alt="Generated result" layout="fill" className="object-contain rounded-md"/>
                      </div>
                      <Button onClick={() => download(generationResult.id, `chimeralens-${generationResult.id.substring(0, 6)}.png`)} disabled={isDownloading} className="mt-2" size="lg">
                        <Download className="mr-2 h-5 w-5" />
                        {isDownloading ? 'Downloading...' : 'Download Image'}
                      </Button>
                    </div>
                  )}

                  {!isPending && !isError && !generationResult && (
                     <div className="text-center text-muted-foreground p-4">
                        <Sparkles className="mx-auto h-12 w-12 opacity-30 mb-4" />
                        <p className="font-semibold">Your Masterpiece Awaits</p>
                        <p className="text-sm">Complete the steps on the left to begin.</p>
                     </div>
                  )}
                </CardContent>
              </Card>
               <div className="mt-6">
                <Button 
                  onClick={handleGenerateClick} 
                  disabled={!selectedTemplate || !sourceFile || status !== 'ready' || isPending}
                  size="lg" 
                  className="w-full h-16 text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all transform-gpu"
                >
                  <Wand2 className="mr-3 h-7 w-7" />
                  {isPending ? 'Creating...' : `Generate Image (1 Credit)`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

