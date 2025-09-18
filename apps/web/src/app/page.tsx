'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@/hooks/use-user';
import { TemplateGallery } from '@/components/template-gallery';
import { Template } from '@/hooks/use-templates';
import { ImageUploader } from '@/components/image-uploader';
import { useGeneration } from '@/hooks/use-generation';
import Image from 'next/image';
import { Button } from '@/components/ui/button'; // <-- 导入 Shadcn Button
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // <-- 导入 Shadcn Card
import { toast } from 'sonner'; // <-- 导入 sonner

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);

  const { data: userResponse, refetch: refetchUser } = useUser();
  const user = userResponse?.data.user;

  const { mutate: generate, data: generationResponse, isPending, isError, error, isSuccess } = useGeneration();
  
  // 使用 useEffect 来处理请求的副作用 (弹出通知)
  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
    if (isSuccess) {
      toast.success('Image generated successfully!');
      refetchUser(); // 成功后，重新获取用户信息以更新点数
    }
  }, [isError, isSuccess, error, refetchUser]);

  useEffect(() => {
    setIsClient(true);
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
      guestId = uuidv4();
      localStorage.setItem('guestId', guestId);
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
      templateImageUrl: selectedTemplate.imageUrl,
      modelKey: 'stable-swap-v1' // 使用我们配置好的稳定模型
    });
  };

  const generationResult = generationResponse?.data;

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      <header className="p-4 border-b flex justify-between items-center">
        <h1 className="text-xl font-bold">ChimeraLens AI</h1>
        {isClient && (
          <div className="p-2 border rounded-md text-sm font-semibold bg-white dark:bg-gray-800">
            ✨ Credits: {user?.credits ?? '...'}
          </div>
        )}
      </header>

      <main className="p-4 md:p-8 flex flex-col items-center gap-8">
        <TemplateGallery 
          selectedTemplateId={selectedTemplate?.id}
          onSelectTemplate={setSelectedTemplate}
        />
        
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Upload Your Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader onFileSelect={setSourceFile} />
          </CardContent>
        </Card>

        <Button 
          onClick={handleGenerateClick}
          disabled={isPending}
          size="lg"
          className="w-full max-w-md h-16 text-xl font-bold"
        >
          {isPending ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          ) : 'Generate Image'}
        </Button>
        
        <Card className="w-full max-w-md aspect-square">
          <CardHeader>
            <CardTitle className="text-center">Result</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-full">
            {isPending && <p className="text-gray-500">Generating, please wait...</p>}
            {generationResult && (
              <Image src={generationResult.resultImageUrl} alt="Generated result" width={512} height={512} className="object-contain rounded-md"/>
            )}
            {!isPending && !generationResult && <p className="text-gray-400">Your result will appear here</p>}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}