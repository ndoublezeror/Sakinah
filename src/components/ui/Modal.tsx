import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
};

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-plum-dark/40 backdrop-blur-sm" />
      <div
        className={`relative bg-card rounded-3xl card-shadow p-6 w-full ${maxWidth} max-h-[85vh] overflow-y-auto animate-pop-in border border-pink-primary/20`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-plum dark:text-pink-light">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-pink-primary/10 text-plum/60 dark:text-pink-light/60 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
