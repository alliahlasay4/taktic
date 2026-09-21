import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from './AuthModal';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main,#0a0e17)] text-emerald-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">Loading Taktic...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal isOpen={true} />;
  }

  return <>{children}</>;
};
