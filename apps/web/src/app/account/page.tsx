'use client';

import { UserNav } from '@/components/user-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProfileForm } from '@/components/profile-form';

import { OrderHistory } from '@/components/order-history';
import { AvatarUploader } from '@/components/avatar-uploader';

export default function AccountPage() {
  return (
    <div className="w-full min-h-screen bg-background">
      <header className="p-4 border-b bg-background sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            ChimeraLens AI
          </Link>
          <div className="flex items-center gap-4">
             <Button asChild variant="secondary">
                <Link href="/">Back to Generator</Link>
             </Button>
             <UserNav />
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Account Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings, profile, and billing information.
                </p>
            </div>
            <Separator />
            
            <Card>
                <CardHeader>
                    <CardTitle>Avatar</CardTitle>
                    <CardDescription>Update your profile picture.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AvatarUploader />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Update your personal information.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProfileForm />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>View your past credit purchases.</CardDescription>
                </CardHeader>
                <CardContent>
                    <OrderHistory />
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}