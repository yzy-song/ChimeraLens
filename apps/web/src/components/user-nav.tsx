'use client';
import { useUser } from '@/hooks/use-user';
import { Button } from './ui/button';
import { useAuthStore } from '@/store/auth.store';
import { useState } from 'react';
import { AuthModal } from './auth-modal';

import { BillingModal } from './billing-modal'; 
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';

import { SecurityModal } from './security-modal';
import { useModalStore } from "@/store/modal.store";

export function UserNav() {
  const { data: userResponse } = useUser();
  const user = userResponse?.data.user;
  const { logout, token } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isSecurityModalOpen, setSecurityModalOpen] = useState(false);

  const { isAuthModalOpen, openAuthModal, closeAuthModal } = useModalStore();

  // 如果用户已登录
  if (token && user && !user.isGuest) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user.name?.[0] || user.email?.[0]}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/gallery">My Creations</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account">Account Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSecurityModalOpen(true)}>
              Security
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsBillingModalOpen(true)}>
              Buy Credits
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout()}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <BillingModal open={isBillingModalOpen} onOpenChange={setIsBillingModalOpen} />
        <SecurityModal open={isSecurityModalOpen} onOpenChange={setSecurityModalOpen} />
      </>
    )
  }

  // 如果是游客
  return (
    <>
      <div className="flex items-center gap-2">
        <Button onClick={openAuthModal} variant="outline">Login</Button>
      </div>
      <AuthModal open={isAuthModalOpen} onOpenChange={closeAuthModal} />
      <BillingModal open={isBillingModalOpen} onOpenChange={setIsBillingModalOpen} /> 
  
    </>
  );
}