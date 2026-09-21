import React, { useState } from 'react';
import { X, ShieldCheck, Sparkles, Flame, Trophy, Zap, Target } from 'lucide-react';
import { CircleFeedPost } from '../../types';

interface ShareMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (type: CircleFeedPost['type'], title: string, detail: string) => void;
}

export const ShareMilestoneModal: React.FC<ShareMilestoneModalProps> = ({
  isOpen,
  onClose,
  onShare,
}) => {
  const [type, setType] = useState<CircleFeedPost['type']>('ring_closed');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onShare(type, title.trim(), detail.trim() || 'Achieved in silent focus sprint.');
    setTitle('');
    setDetail('');
    onClose();
  };

  const presetTitles = {
    ring_closed: 'Closed 3/3 Daily Focus Rings 🏆',
    streak_milestone: 'Reached 14-Day Consistency Streak 🔥',
    focus_marathon: 'Completed 120-Min Deep Work Sprint ⚡',
    habit_mastered: 'Mastered 5 Daily Routines 🎯',
  };

  const handleSelectPreset = (selectedType: CircleFeedPost['type']) => {
    setType(selectedType);
    setTitle(presetTitles[selectedType]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface,#121824)] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-white">Share Milestone</h3>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Private titles only (No task details leaked)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Milestone Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Select Milestone Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'ring_closed', label: 'Rings Closed', icon: Trophy, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
                { id: 'streak_milestone', label: 'Streak Level', icon: Flame, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
                { id: 'focus_marathon', label: 'Sprint Marathon', icon: Zap, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
                { id: 'habit_mastered', label: 'Habit Mastery', icon: Target, color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPreset(item.id as CircleFeedPost['type'])}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition ${
                      isSelected
                        ? `${item.color} font-bold shadow-xs`
                        : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Achievement Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Achievement Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Completed 90 Mins Deep Focus"
              required
              className="w-full rounded-xl border border-gray-800 bg-gray-900/60 p-3 text-xs text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Detail Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Optional Note (Privacy Masked)
            </label>
            <input
              type="text"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="e.g., Kept full focus during afternoon sprint"
              className="w-full rounded-xl border border-gray-800 bg-gray-900/60 p-3 text-xs text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Privacy Guarantee Badge */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <p className="text-[11px] text-emerald-200/90 leading-tight">
              Taktic automatically strips task titles, URLs, and confidential client details before posting to your social circle.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-semibold text-black shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Broadcast to Circle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
