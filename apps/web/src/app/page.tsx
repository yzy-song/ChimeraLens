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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);

  const { data: userResponse, refetch: refetchUser } = useUser();
  const user = userResponse?.data.user;

  const { mutate: generate, data: generationResponse, isPending, isError, error, isSuccess } = useGeneration();
  
  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
    if (isSuccess) {
      toast.success('Image generated successfully!');
      refetchUser();
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
      modelKey: 'unstable-swap-v2'
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

      <main className="p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto">
          {/* 左侧栏：模板和上传 */}
          <div className="flex flex-col items-center gap-8">
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
          </div>

          {/* 右侧栏：生成按钮和结果 */}
          <div className="flex flex-col items-center gap-4 lg:sticky lg:top-8">
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
              <CardContent className="flex items-center justify-center h-full p-2">
                {isPending ? (
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <div className="flex items-center gap-4">
                      {sourceFile && (
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2">
                          <Image src={URL.createObjectURL(sourceFile)} alt="Your photo" width={96} height={96} className="object-cover w-full h-full"/>
                        </div>
                      )}
                      <div className="text-3xl animate-pulse">→</div>
                      {selectedTemplate && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden border-2">
                          <Image src={selectedTemplate.imageUrl} alt="Template" width={96} height={96} className="object-cover w-full h-full"/>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-500 animate-pulse mt-4">Generating, please wait...</p>
                  </div>
                ) : (
                  <>
                    {isError && <p className="text-red-500 p-4">Error: {error.message}</p>}
                    {generationResult && (
                      <Image src={generationResult.resultImageUrl} alt="Generated result" width={512} height={512} className="object-contain rounded-md"/>
                    )}
                    {!isPending && !isError && !generationResult && <p className="text-gray-400">Your result will appear here</p>}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}