'use client';

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "./ui/button";
import { changePasswordSchema, forgotPasswordSchema } from "@/lib/schemas/auth.schema";
import { useChangePassword } from "@/hooks/use-change-password";
import { useForgotPassword } from "@/hooks/use-forgot-password";
import { PasswordInput } from "./ui/password-input";
import { useUser } from "@/hooks/use-user";
import { useState } from "react";
import { Input } from "./ui/input";

interface SecurityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SecurityView = 'change_password' | 'forgot_password';

export function SecurityModal({ open, onOpenChange }: SecurityModalProps) {
  const [view, setView] = useState<SecurityView>('change_password');
  const { data: userResponse } = useUser();
  const user = userResponse?.data.user;
  

  const { mutate: changePassword, isPending: isChangePasswordPending } = useChangePassword();
  const { mutate: forgotPassword, isPending: isForgotPasswordPending } = useForgotPassword();

  const isPending = isChangePasswordPending || isForgotPasswordPending;
  const hasPassword = !!user?.hasPassword;

  console.log('User in SecurityModal hasPassword:', hasPassword);
  const changePasswordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: user?.email || "" },
  });

  const onChangePasswordSubmit = (values: z.infer<typeof changePasswordSchema>) => {
    const payload = {
        newPassword: values.newPassword,
        ...(hasPassword && { currentPassword: values.currentPassword })
    };
    changePassword(payload, {
        onSuccess: () => {
            onOpenChange(false);
            changePasswordForm.reset();
        }
    });
  };

  const onForgotPasswordSubmit = (values: z.infer<typeof forgotPasswordSchema>) => {
    forgotPassword(values, {
        onSuccess: () => {
            onOpenChange(false);
            setView('change_password');
            forgotPasswordForm.reset();
        }
    });
  };
  
  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
        // Reset view to default when closing the modal
        setView('change_password');
        changePasswordForm.reset();
        forgotPasswordForm.reset();
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {view === 'change_password' && (
          <>
            <DialogHeader>
              <DialogTitle>{hasPassword ? 'Change Password' : 'Set Your Password'}</DialogTitle>
              <DialogDescription>
                {hasPassword 
                    ? 'Enter your current and new password below.'
                    : 'Create a password to be able to sign in with your email.'
                }
              </DialogDescription>
            </DialogHeader>
            <Form {...changePasswordForm}>
              <form onSubmit={changePasswordForm.handleSubmit(onChangePasswordSubmit)} className="space-y-4">
                {hasPassword && (
                    <FormField control={changePasswordForm.control} name="currentPassword" render={({ field }) => (
                        <FormItem><FormLabel>Current Password</FormLabel><FormControl><PasswordInput placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                )}
                <FormField control={changePasswordForm.control} name="newPassword" render={({ field }) => (
                    <FormItem><FormLabel>New Password</FormLabel><FormControl><PasswordInput placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={changePasswordForm.control} name="confirmNewPassword" render={({ field }) => (
                    <FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><PasswordInput placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                {hasPassword && (
                    <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={() => setView('forgot_password')}>
                        Forgot your password?
                    </Button>
                )}

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </Form>
          </>
        )}

        {view === 'forgot_password' && (
            <>
                <DialogHeader>
                    <DialogTitle>Forgot Password</DialogTitle>
                    <DialogDescription>
                        We will send a password reset link to your email address.
                    </DialogDescription>
                </DialogHeader>
                <Form {...forgotPasswordForm}>
                    <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                        <FormField control={forgotPasswordForm.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="your@email.com" {...field} readOnly={!!user?.email} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <div className="flex items-center justify-between">
                            <Button type="button" variant="link" className="p-0 h-auto" onClick={() => setView('change_password')}>
                                Back to change password
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? 'Sending...' : 'Send Reset Link'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </>
        )}
      </DialogContent>
    </Dialog>
  );
}
