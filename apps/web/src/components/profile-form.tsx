// 在 `/account/page.tsx` 中替换 ProfileForm
// 或者创建一个新文件 `apps/web/src/components/profile-form.tsx`

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '@/hooks/use-user';
import { useUpdateProfile } from '@/hooks/use-update-profile';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).optional(),
  email: z.string().email(),
});

export function ProfileForm() {
    const { data: userResponse } = useUser();
    const user = userResponse?.data.user;
    const { mutate: updateProfile, isPending } = useUpdateProfile();

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
        },
    });

    useEffect(() => {
        if (user) {
            form.reset({
                name: user.name || '',
                email: user.email || '',
            });
        }
    }, [user, form]);
    
    const onSubmit = (values: z.infer<typeof profileSchema>) => {
        updateProfile({ name: values.name });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input {...field} readOnly disabled />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Your Name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </form>
        </Form>
    )
}