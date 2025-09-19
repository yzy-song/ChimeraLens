import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BillingCanceledPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-4xl font-bold mb-4">Payment Canceled</h1>
      <p className="mb-8">Your order was canceled. You have not been charged.</p>
      <Button asChild>
        <Link href="/">Back to Generation</Link>
      </Button>
    </div>
  );
}