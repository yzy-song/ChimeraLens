'use client';
import { useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BillingSuccessPage() {
  const { refetch } = useUser();

  // 进入页面后，立即重新获取用户信息，此时 webhook 可能已处理完，点数已更新
  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
      <p className="mb-8">Your credits have been added to your account.</p>
      <Button asChild>
        <Link href="/">Back to Generation</Link>
      </Button>
    </div>
  );
}