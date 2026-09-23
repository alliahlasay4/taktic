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
    <div className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-2xl backdrop-blur-xl transition-all ${animationClass}`}>
      {/* Drawer Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
            <Coffee className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
              <span>Break Lounge Chat</span>
            </h3>
            <p className="text-[10px] text-[var(--text-secondary)]">Connect with co-workers during break intervals</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition hover:bg-[var(--card-hover)]">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Countdown & Imminent Closing Warning Banner */}
      <div className={`my-3 rounded-2xl border p-3 flex flex-col gap-1 transition-all ${
        isClosingSoon
          ? 'border-red-500/50 bg-red-500/10 animate-pulse text-red-700 dark:text-red-300'
          : 'border-amber-500/30 bg-amber-500/10 text-[var(--text-primary)]'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isClosingSoon ? (
              <AlertTriangle className="h-4 w-4 text-red-500 animate-bounce" />
            ) : (
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
            )}
            <span className="text-xs font-semibold">
              {isClosingSoon
                ? 'Break Ending Soon!'
                : isBreakActive
                ? 'Break Time Remaining:'
                : 'Sprint Time Remaining:'}
            </span>
          </div>
          <span className={`font-mono text-sm font-bold ${
            isClosingSoon ? 'text-red-500 scale-110' : isBreakActive ? 'text-amber-700 dark:text-amber-400' : 'text-[var(--accent-dusty-rose)]'
          }`}>
            {roomSeconds !== undefined ? formatTime(roomSeconds) : '--:--'}
          </span>
        </div>

        {isClosingSoon && (
          <p className="text-[10px] text-red-700 dark:text-red-300 font-medium mt-0.5">
            ⚡ Focus Sprint starting in {roomSeconds}s — chat will close automatically with alert.
          </p>
        )}
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto py-2 space-y-3">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-3 transition hover:border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-[var(--accent-dusty-rose)]">{msg.userName}</span>
                <span className="text-[9px] text-[var(--text-muted)]">{msg.timestamp}</span>
              </div>
              <p className="text-xs text-[var(--text-primary)] leading-relaxed">{msg.content}</p>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)]">
            <MessageSquare className="h-8 w-8 mb-2 text-[var(--text-muted)]" />
            <p className="text-xs font-medium">No messages in break lounge yet</p>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Share how your focus sprint went!</p>
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
          className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] py-2 px-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-terracotta)] text-white hover:brightness-110 transition disabled:opacity-40 shadow-md"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};

