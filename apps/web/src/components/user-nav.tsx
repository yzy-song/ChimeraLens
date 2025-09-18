'use client';
import { useUser } from '@/hooks/use-user';
import { Button } from './ui/button';
import { useAuthStore } from '@/store/auth.store';
import { useState } from 'react';
import { AuthModal } from './auth-modal';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserNav() {
  const { data: userResponse } = useUser();
  const user = userResponse?.data.user;
  const { logout, token } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 如果用户已登录
  if (token && user && !user.isGuest) {
    return (
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
          <DropdownMenuItem onClick={() => logout()}>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // 如果是游客
  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>Login</Button>
      <AuthModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}