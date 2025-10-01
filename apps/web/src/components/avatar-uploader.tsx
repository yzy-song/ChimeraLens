
import { useUser } from '@/hooks/use-user';
import { useState, ChangeEvent, useRef } from 'react';
import { useUpdateAvatar } from '@/hooks/use-update-avatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';


export function AvatarUploader() {
    const { data: userResponse } = useUser();
    const user = userResponse?.data.user;
    const { mutate: updateAvatar, isPending } = useUpdateAvatar();
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleUpload = () => {
        const file = fileInputRef.current?.files?.[0];
        if (file) {
            updateAvatar(file, {
                onSuccess: () => setPreview(null)
            });
        }
    };

    const currentAvatarUrl = preview || user?.avatarUrl;

    return (
        <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
                {currentAvatarUrl && <AvatarImage src={currentAvatarUrl} alt={user?.name || 'User Avatar'} />}
                <AvatarFallback>{user?.name?.[0] || user?.email?.[0]}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Choose Image
                </Button>
                {preview && (
                    <Button type="button" onClick={handleUpload} disabled={isPending}>
                        {isPending ? "Uploading..." : "Save Avatar"}
                    </Button>
                )}
            </div>
        </div>
    );
}