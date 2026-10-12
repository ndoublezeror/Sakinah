import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-app islamic-pattern flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo size="lg" />
          <span className="w-8 h-8 border-3 border-pink-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
