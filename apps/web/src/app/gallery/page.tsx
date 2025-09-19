'use client';

import { useState } from 'react';
import { useGenerations } from '@/hooks/use-generations';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Generation } from '@chimeralens/db';

export default function GalleryPage() {
  const [page, setPage] = useState(1);
  const limit = 8;

  const { data: response, isLoading, isError, error } = useGenerations({ page, limit });

  const generations: Generation[] = Array.isArray(response?.data) ? response.data : [];
  const meta = response?.meta;

  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="p-4 border-b bg-white dark:bg-gray-950 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            ChimeraLens AI
          </Link>
          <Button asChild variant="secondary">
            <Link href="/">Back to Generator</Link>
          </Button>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Creations</h1>

        {isLoading && <p>Loading your creations...</p>}
        {isError && <p className="text-red-500">Error: {error.message}</p>}

        {!isLoading && generations.length === 0 && (
          <p>You haven't created any images yet. <Link href="/" className="text-blue-500 hover:underline">Start creating now!</Link></p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {generations.map((gen) => (
            <Card key={gen.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <Image
                    src={gen.resultImageUrl}
                    alt="Generated image"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination Controls */}
        {meta && meta.total > 0 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button onClick={() => setPage(page - 1)} disabled={page === 1}>
              Previous
            </Button>
            <span>Page {meta.page} of {meta.lastPage}</span>
            <Button onClick={() => setPage(page + 1)} disabled={page === meta.lastPage}>
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}