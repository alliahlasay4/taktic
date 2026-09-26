import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, Flame, CheckCircle, X } from 'lucide-react';
import { soundEngine } from '../../lib/audio';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  streakCount: number;
}

export const RewardModal: React.FC<RewardModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  streakCount,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Play celebratory accomplishment fanfare
      soundEngine.playCelebrationSound();

      // Fire confetti burst!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C87D87', '#C06C4C', '#CFA052', '#6B8E6E', '#B08B9E'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-sm rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#C06C4C] via-[#C87D87] to-[#CFA052] text-white shadow-lg shadow-[#C06C4C]/30">
          <Trophy className="h-8 w-8 animate-bounce" />
        </div>

        <h3 className="font-heading font-bold text-xl text-[var(--text-primary)] mb-1">
          {title}
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mb-6">
          {message}
        </p>

        <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#C06C4C]/15 py-3 mb-6">
          <Flame className="h-5 w-5 fill-[#C06C4C] text-[#C06C4C]" />
          <span className="font-heading font-bold text-base text-[#C06C4C]">
            {streakCount} Day Focus Streak Maintained!
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-gradient-to-r from-[#C06C4C] to-[#C87D87] py-2.5 text-xs font-semibold text-white shadow-md shadow-[#C06C4C]/20 hover:opacity-90"
        >
          Keep Building Rhythm
        </button>
      </div>
    </div>
  );
};
