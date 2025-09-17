'use client';
import { useEffect, useState } from 'react'; 
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@/hooks/use-user';

export default function Home() {
  const [isClient, setIsClient] = useState(false); 
  // 在组件加载时，检查并设置 guestId
  useEffect(() => {
    setIsClient(true); 
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
      guestId = uuidv4();
      localStorage.setItem('guestId', guestId);
    }
  }, []);

  // 使用 useUser hook 从后端获取数据
  const { data, isLoading, isError } = useUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">ChimeraLens AI</h1>
      <div className="p-4 border rounded-lg">
        <h2 className="text-2xl mb-2">User Status</h2>
        {isLoading && <p>Loading user data...</p>}
        {isError && <p>Error fetching user data.</p>}
        {data && (
          <div>
            <p>
              User ID: {data.data.user?.id || 'N/A'}
            </p>
            <p>
              Guest ID: {data.data.user?.guestId || 'N/A'}
            </p>
            <p className="font-bold text-lg">
              Credits: ✨ {data.data.user?.credits ?? '...'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}