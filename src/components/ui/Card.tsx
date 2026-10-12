import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  noPadding?: boolean;
};

export function Card({ children, className = '', onClick, noPadding = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-3xl card-shadow border border-pink-primary/10 ${noPadding ? '' : 'p-5'} ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
