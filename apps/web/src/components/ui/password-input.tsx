// apps/web/src/components/ui/password-input.tsx
'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from './button';

export interface PasswordInputProps extends React.ComponentPropsWithoutRef<'input'> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn('pr-10 peer', className)} // 1. 添加 'peer' class
          ref={ref}
          // 确保 placeholder 存在，以便下面的 CSS 逻辑生效
          placeholder={props.placeholder || "••••••••"} 
          {...props}
          value={props.value ?? ''} // 保证 value 不为 undefined
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="
            absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent
            opacity-0 peer-focus:opacity-100 peer-[:not(:placeholder-shown)]:opacity-100
            transition-opacity duration-200
          " // 2. 添加核心的显示/隐藏/过渡样式
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={props.disabled}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only">
            {showPassword ? 'Hide password' : 'Show password'}
          </span>
        </Button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };