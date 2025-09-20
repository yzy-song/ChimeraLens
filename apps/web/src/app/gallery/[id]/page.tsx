import { api } from '@/lib/api';
import { Generation } from '@chimeralens/db';
import { ApiResponse } from '@/types';
import { Metadata } from 'next';
import ArtworkDetailView from '@/components/artwork-detail-view'; // Import client component

// This function fetches data on the server
async function getGeneration(id: string): Promise<Generation | null> {
  try {
    // Use fetch directly because the api instance includes client interceptors
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generations/${id}`);
    if (!response.ok) {
        return null;
    }
    const result: ApiResponse<Generation> = await response.json();
    return result.data;
  } catch (error) {
    console.error("Failed to fetch artwork on the server:", error);
    return null;
  }
}

// This function dynamically generates metadata for the page
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const generation = await getGeneration(id);

  if (!generation) {
    return {
      title: 'Artwork Not Found | ChimeraLens',
      description: 'The requested artwork could not be found.',
    };
  }

  const title = `My AI Creation #${generation.id.substring(0, 6)} | ChimeraLens`;
  const description = 'Check out this awesome image I created with ChimeraLens!';

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: generation.resultImageUrl,
          width: 512,
          height: 512,
          alt: 'Generated AI Artwork',
        },
      ],
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/gallery/${generation.id}`,
      siteName: 'ChimeraLens',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [generation.resultImageUrl],
    },
  };
}

// The page component itself
export default async function ArtworkPage({ params }: { params: { id: string } }) {
  const { id } = await params; // Await here if needed

  const generation = await getGeneration(id);

  if (!generation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-4xl font-bold mb-4">Artwork Not Found</h1>
        <p>The artwork you are looking for does not exist or has been deleted.</p>
      </div>
    );
  }

  return <ArtworkDetailView id={id} initialData={generation} />;
}

