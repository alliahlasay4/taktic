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
    <div className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-emerald-500/20 bg-[var(--card-surface,#121824)] p-5 shadow-2xl backdrop-blur-xl transition-all ${animationClass}`}>
      {/* Drawer Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <Coffee className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
              <span>Break Lounge Chat</span>
            </h3>
            <p className="text-[10px] text-gray-400">Connect with co-workers during break intervals</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-white transition hover:bg-gray-800">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Countdown & Imminent Closing Warning Banner */}
      <div className={`my-3 rounded-2xl border p-3 flex flex-col gap-1 transition-all ${
        isClosingSoon
          ? 'border-red-500/50 bg-red-950/40 animate-pulse text-red-300'
          : 'border-amber-500/30 bg-amber-950/30 text-gray-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isClosingSoon ? (
              <AlertTriangle className="h-4 w-4 text-red-400 animate-bounce" />
            ) : (
              <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
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
            isClosingSoon ? 'text-red-400 scale-110' : isBreakActive ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {roomSeconds !== undefined ? formatTime(roomSeconds) : '--:--'}
          </span>
        </div>

        {isClosingSoon && (
          <p className="text-[10px] text-red-300 font-medium mt-0.5">
            ⚡ Focus Sprint starting in {roomSeconds}s — chat will close automatically with alert.
          </p>
        )}
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto py-2 space-y-3">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className="rounded-2xl border border-gray-800 bg-gray-900/50 p-3 transition hover:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-emerald-400">{msg.userName}</span>
                <span className="text-[9px] text-gray-500">{msg.timestamp}</span>
              </div>
              <p className="text-xs text-gray-200 leading-relaxed">{msg.content}</p>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <MessageSquare className="h-8 w-8 mb-2 text-gray-600" />
            <p className="text-xs font-medium">No messages in break lounge yet</p>
            <p className="text-[10px] text-gray-600 mt-0.5">Share how your focus sprint went!</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="pt-3 border-t border-gray-800 flex items-center gap-2">
        <input
          type="text"
          placeholder={isBreakActive ? 'Share a break note...' : 'Chat active during break...'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 rounded-xl border border-gray-800 bg-gray-900/60 py-2 px-3 text-xs text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 transition disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};

