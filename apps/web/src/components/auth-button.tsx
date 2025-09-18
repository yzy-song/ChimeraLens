'use client';
import { useUser } from '@/hooks/use-user';
import { Button } from './ui/button';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useFirebaseLogin } from '@/hooks/use-firebase-login';
import { useAuthStore } from '@/store/auth.store';

export function AuthButton() {
  const { data: userResponse } = useUser();
  const user = userResponse?.data.user;
  const { mutate: firebaseLogin, isPending } = useFirebaseLogin();
  const { logout, token } = useAuthStore();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      firebaseLogin(idToken); // 将 Firebase idToken 发送给我们的后端
    } catch (error) {
      console.error('Google Sign-In Error:', error);
    }
  };

  const handleLogout = () => {
    logout();
    // 重新获取用户信息，UI 会自动更新为游客状态
    // useUser hook will refetch automatically
  }

  // 如果用户已登录 (通过我们自己的 token 判断)
  if (token && user && !user.isGuest) {
    return (
      <div className='flex items-center gap-4'>
        <span className='text-sm font-medium'>Welcome, {user.name || user.email}</span>
        <Button onClick={handleLogout} variant="outline">Logout</Button>
      </div>
    )
  }

  // 否则，显示登录按钮
  return (
    <Button onClick={handleGoogleSignIn} disabled={isPending}>
      {isPending ? 'Logging in...' : 'Sign in with Google'}
    </Button>
  );
}