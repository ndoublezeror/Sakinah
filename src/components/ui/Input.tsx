import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

type InputProps = {
  label?: string;
  error?: string;
  hint?: ReactNode;
  icon?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', ...rest }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-bold text-plum dark:text-pink-light">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute inset-y-0 inline-start-0 flex items-center ps-3 text-pink-deep/50">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`w-full bg-blush dark:bg-plum-dark/50 border-2 rounded-2xl px-4 py-3 text-plum dark:text-pink-light placeholder:text-plum/40 dark:placeholder:text-pink-light/40 outline-none transition-all ${icon ? 'ps-10' : ''} ${error ? 'border-red-400 focus:border-red-500' : 'border-pink-primary/20 focus:border-pink-primary'} ${className}`}
            {...rest}
          />
        </div>
        {hint && <p className="text-xs text-plum/60 dark:text-pink-light/60">{hint}</p>}
        {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
