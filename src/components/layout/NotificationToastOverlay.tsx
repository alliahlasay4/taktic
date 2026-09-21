import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Repeat, Flame, Users, Bell, X, Sparkles } from 'lucide-react';
import { ToastItem } from '../../hooks/useInAppNotifications';

interface NotificationToastOverlayProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const NotificationToastOverlay: React.FC<NotificationToastOverlayProps> = ({ toasts, onDismiss }) => {
  const getIcon = (type: ToastItem['type']) => {
    switch (type) {
      case 'timer':
        return <Clock className="h-5 w-5 text-[#CFA052]" />;
      case 'habit':
        return <Repeat className="h-5 w-5 text-emerald-400" />;
      case 'streak':
        return <Flame className="h-5 w-5 text-amber-500" />;
      case 'circle':
        return <Users className="h-5 w-5 text-[#C87D87]" />;
      default:
        return <Sparkles className="h-5 w-5 text-teal-400" />;
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)]/95 backdrop-blur-md p-4 shadow-2xl text-[var(--text-primary)]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
              {getIcon(toast.type)}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs font-bold text-[var(--text-primary)] tracking-tight">{toast.title}</h4>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)] leading-snug line-clamp-2">{toast.message}</p>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)] transition shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
