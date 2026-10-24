import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Coffee, Clock } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setAnimationClass('animate-in slide-in-from-right duration-250');
    } else if (shouldRender) {
      setAnimationClass('animate-out slide-out-to-right duration-200 fill-mode-forwards');
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  // Auto-close if session resumes while drawer is open
  useEffect(() => {
    if (!isBreakActive && isOpen) {
      onClose();
    }
  }, [isBreakActive, isOpen, onClose]);

  // Scroll to bottom when messages update or drawer opens
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!shouldRender) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim());
    setInputText('');
  };

  const isClosingSoon = isBreakActive && roomSeconds !== undefined && roomSeconds <= 10 && roomSeconds > 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      {/* Click outside backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity pointer-events-auto"
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className={`relative z-10 flex w-full max-w-sm sm:max-w-md flex-col border-l border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-2xl transition-all pointer-events-auto h-full ${animationClass}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Coffee className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                  Break Lounge
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isBreakActive
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isBreakActive ? 'bg-amber-500 animate-ping' : 'bg-stone-400'
                    }`}
                  />
                  {isBreakActive ? 'Break Active' : 'Session in Progress'}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Chat and connect between focus sessions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer"
            aria-label="Close break lounge"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Ambient Timer / Subtle Countdown Bar */}
        <div
          className={`px-5 py-2 border-b flex items-center justify-between text-xs transition-colors ${
            isClosingSoon
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold'
              : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)]/60 text-[var(--text-secondary)]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Clock
              className={`h-3.5 w-3.5 ${
                isClosingSoon
                  ? 'text-amber-600 dark:text-amber-400 animate-pulse'
                  : 'text-[var(--text-muted)]'
              }`}
            />
            <span>
              {isClosingSoon
                ? `Focus sprint resumes in ${roomSeconds}s`
                : isBreakActive
                ? 'Break time remaining'
                : 'Next break interval'}
            </span>
          </div>

          <span className="font-mono font-bold text-[var(--text-primary)]">
            {roomSeconds !== undefined ? formatTime(roomSeconds) : '--:--'}
          </span>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2.5 group">
                {msg.userAvatar ? (
                  <img
                    src={msg.userAvatar}
                    alt={msg.userName}
                    className="h-7 w-7 rounded-lg object-cover ring-1 ring-[var(--border-subtle)] shrink-0 mt-0.5"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-lg bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {msg.userName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-bold text-xs text-[var(--text-primary)] truncate">
                      {msg.userName}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {msg.timestamp}
                    </span>
                  </div>
                  <div className="rounded-xl rounded-tl-xs bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--text-primary)] leading-relaxed break-words">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-sunken)] text-[var(--text-muted)]">
                <Coffee className="h-5 w-5 text-amber-500/70" />
              </div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                No messages yet
              </p>
              <p className="text-[11px] text-[var(--text-muted)] max-w-xs">
                Take a breath, stretch, and leave a friendly note for your co-workers.
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/50">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              id="break-chat-message-input"
              name="chatMessage"
              type="text"
              placeholder={isBreakActive ? 'Write a message...' : 'Chat opens during break...'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              aria-label="Break message"
              autoComplete="off"
              disabled={!isBreakActive}
              className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] py-2 px-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-terracotta)] disabled:opacity-50 transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || !isBreakActive}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-[var(--accent-terracotta)] text-white hover:brightness-110 active:scale-95 transition disabled:opacity-30 cursor-pointer shadow-xs shrink-0"
              title="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

