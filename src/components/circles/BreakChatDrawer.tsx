import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, Coffee, Clock, AlertTriangle } from 'lucide-react';
import { formatTime } from '../../lib/utils';

export interface RoomMessage {
  id: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
}

interface BreakChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: RoomMessage[];
  onSendMessage: (text: string) => void;
  isBreakActive: boolean;
  roomSeconds?: number;
  autoCloseReason?: string | null;
}

export const BreakChatDrawer: React.FC<BreakChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isBreakActive,
  roomSeconds,
}) => {
  const [inputText, setInputText] = useState('');
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setAnimationClass('animate-in slide-in-from-right duration-300');
    } else if (shouldRender) {
      setAnimationClass('animate-out slide-out-to-right duration-300 fill-mode-forwards');
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 280);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim());
    setInputText('');
  };

  const isClosingSoon = isBreakActive && roomSeconds !== undefined && roomSeconds <= 10 && roomSeconds > 0;

  return (
    <div className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-main)] p-5 shadow-2xl transition-all ${animationClass}`}>
      {/* Drawer Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[var(--accent-warm-ochre)] shadow-2xs">
            <Coffee className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
              Break Lounge Chat
            </h3>
            <p className="text-[10px] text-[var(--text-secondary)]">Connect with co-workers during break intervals</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] border border-transparent hover:border-[var(--border-subtle)] transition"
          aria-label="Close break chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Countdown & Imminent Closing Warning Banner */}
      <div className={`my-3 rounded-2xl border p-3.5 flex flex-col gap-1.5 transition-all shadow-xs ${
        isClosingSoon
          ? 'border-red-500/80 bg-red-500/10 dark:bg-red-500/15 ring-2 ring-red-500/20 shadow-md shadow-red-500/10'
          : 'border-[var(--border-subtle)] bg-[var(--card-surface)]'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isClosingSoon ? (
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 animate-bounce shrink-0" />
            ) : (
              <Clock className="h-4 w-4 text-[var(--accent-warm-ochre)] animate-pulse shrink-0" />
            )}
            <span className={`text-xs font-bold ${
              isClosingSoon ? 'text-red-600 dark:text-red-400' : 'text-[var(--text-primary)]'
            }`}>
              {isClosingSoon
                ? 'Break Ending Soon!'
                : isBreakActive
                ? 'Break Time Remaining:'
                : 'Sprint Time Remaining:'}
            </span>
          </div>
          <span className={`font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
            isClosingSoon
              ? 'bg-red-600 text-white shadow-xs'
              : isBreakActive
              ? 'bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] border border-[var(--accent-warm-ochre)]/30'
              : 'bg-[var(--card-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
          }`}>
            {roomSeconds !== undefined ? formatTime(roomSeconds) : '--:--'}
          </span>
        </div>

        {isClosingSoon && (
          <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold leading-relaxed">
            ⚡ Focus Sprint starting in {roomSeconds}s — chat will close automatically.
          </p>
        )}
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto py-2 space-y-2.5">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3.5 shadow-2xs transition hover:border-[var(--accent-terracotta)]/40"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-[var(--accent-terracotta)]">{msg.userName}</span>
                <span className="text-[10px] font-medium text-[var(--text-muted)]">{msg.timestamp}</span>
              </div>
              <p className="text-xs text-[var(--text-primary)] leading-relaxed">{msg.content}</p>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)] p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] mb-2.5 text-[var(--text-muted)]">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-[var(--text-primary)]">No messages yet</p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Share a quick note on how your focus sprint went!</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="pt-3 border-t border-[var(--border-subtle)] flex items-center gap-2">
        <input
          type="text"
          placeholder={isBreakActive ? 'Share a break note...' : 'Chat active during break...'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] py-2.5 px-3.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-terracotta)] transition shadow-2xs"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-terracotta)] text-white hover:brightness-110 active:scale-95 transition disabled:opacity-40 shadow-xs cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};

