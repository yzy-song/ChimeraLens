'use client';

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from './ui/button';
import { useCreateCheckout } from '@/hooks/use-create-checkout';
import { toast } from 'sonner';

import { useUser } from "@/hooks/use-user";
import { useModalStore } from "@/store/modal.store";

interface BillingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const testProd = [
  'price_1S8s2h5AZtVqRLhicy7IarMX',
  'price_1S8s3U5AZtVqRLhiMpWdYhvU',
  'price_1S8s4z5AZtVqRLhiywQF5cj3',
]
const liveProd = [
  'price_1SDokN9cBOPN77U2JVZ4VUYt',
  'price_1SDokL9cBOPN77U2UJyAlM99',
  'price_1SDokG9cBOPN77U2lpaE9D02',
]

let isDev = process.env.NODE_ENV === 'development'

if (!isDev) {
  console.log("Running in production mode");
} else {
  console.log("Running in development mode");
}

const pricingPlans = [
  {
    name: 'ChimeraLens Credits(Starter Pack)',
    priceId: isDev ? testProd[0] : liveProd[0],
    price: '€5',
    credits: 100,
    description: '€0.05 / credit',
  },
  {
    name: 'ChimeraLens Credits(Creater Pack)',
    priceId: isDev ? testProd[1] : liveProd[1],
    price: '€10',
    credits: 250,
    description: '€0.04 / credit',
  },
  
  {
    name: 'ChimeraLens Credits(Pro Pack)',
    priceId: isDev ? testProd[2] : liveProd[2],
    price: '€30',
    credits: 700,
    description: '€0.04 / credit',
  },
];

export function BillingModal({ open, onOpenChange }: BillingModalProps) {
  const { mutate: createCheckout, isPending } = useCreateCheckout();
 const { data: userResponse } = useUser();
  const user = userResponse?.data.user;
  const { openAuthModal } = useModalStore();

  const handleBuyClick = (priceId: string) => {
     if (!user || user.isGuest) {
      toast.error("Please log in or register to purchase credits.");
      onOpenChange(false); 
      openAuthModal();
      return;
    }
    toast.info('Redirecting to checkout...');
    createCheckout(priceId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get More Credits</DialogTitle>
          <DialogDescription>
            Choose a pack that suits your creative needs.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {pricingPlans.map((plan) => (
            <div key={plan.priceId} className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h3 className="font-bold">{plan.name} - {plan.credits} Credits</h3>
                <p className="text-sm text-gray-500">{plan.description}</p>
              </div>
              <Button onClick={() => handleBuyClick(plan.priceId)} disabled={isPending}>
                {plan.price}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}