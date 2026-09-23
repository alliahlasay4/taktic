import React, { useState } from 'react';
import { X, Mail, Link as LinkIcon, Copy, Check, ShieldCheck, Sparkles, Send, MessageCircle } from 'lucide-react';

interface InvitePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendInvite: (email: string, name?: string) => Promise<{ success: boolean; inviteLink: string; message: string }>;
  onGenerateMagicLink: () => { token: string; link: string };
}

export const InvitePartnerModal: React.FC<InvitePartnerModalProps> = ({
  isOpen,
  onClose,
  onSendInvite,
  onGenerateMagicLink,
}) => {
  const [activeTab, setActiveTab] = useState<'email' | 'link'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ link: string; email: string } | null>(null);

  if (!isOpen) return null;

  const defaultLink = onGenerateMagicLink().link;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const result = await onSendInvite(email.trim(), name.trim() || undefined);
      if (result.success) {
        setSuccessInfo({ link: result.inviteLink, email: email.trim() });
        setEmail('');
        setName('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (linkToCopy: string) => {
    navigator.clipboard.writeText(linkToCopy);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareText = `Join my private accountability circle on Taktic! Let's hit our focus goals together: ${defaultLink}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition p-1"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-terracotta)] text-white font-bold shrink-0 shadow-md">
            <Sparkles className="h-5.5 w-5.5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-[var(--text-primary)]">
              Invite Circle Partner
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Share streaks and daily focus milestones with partners.
            </p>
          </div>
        </div>

        {/* Segmented Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('email');
              setSuccessInfo(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition ${
              activeTab === 'email'
                ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-xs font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Mail className="h-4 w-4 text-[var(--accent-terracotta)]" />
            <span>Email Invite</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('link');
              setSuccessInfo(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition ${
              activeTab === 'link'
                ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-xs font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <LinkIcon className="h-4 w-4 text-[var(--accent-warm-ochre)]" />
            <span>Magic Link</span>
          </button>
        </div>

        {/* TAB 1: Email Invite */}
        {activeTab === 'email' && (
          <div>
            {successInfo ? (
              <div className="space-y-4 rounded-2xl border border-[var(--accent-botanical-sage)]/30 bg-[var(--accent-botanical-sage)]/10 p-5 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-botanical-sage)]/20 text-[var(--accent-botanical-sage)] mx-auto">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                    Invitation Created for {successInfo.email}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Opening the link automatically connects them to your Circle Roster.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-2">
                  <input
                    type="text"
                    readOnly
                    value={successInfo.link}
                    className="flex-1 text-[11px] font-mono text-[var(--text-secondary)] bg-transparent focus:outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(successInfo.link)}
                    className="flex items-center gap-1 rounded-lg bg-[var(--accent-terracotta)] text-white px-3 py-1.5 text-xs font-semibold shrink-0 shadow-xs"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSuccessInfo(null)}
                  className="text-xs font-semibold text-[var(--accent-terracotta)] hover:underline"
                >
                  Invite another person
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label htmlFor="partner-email" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Partner Email Address <span className="text-[var(--accent-terracotta)]">*</span>
                  </label>
                  <input
                    id="partner-email"
                    type="email"
                    required
                    placeholder="friend@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none min-h-[42px]"
                  />
                </div>

                <div>
                  <label htmlFor="partner-name" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Name or Nickname <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                  </label>
                  <input
                    id="partner-name"
                    type="text"
                    placeholder="e.g. Alex"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none min-h-[42px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-4 py-2.5 text-xs font-bold text-white shadow-md transition disabled:opacity-40 min-h-[44px] active:scale-98"
                >
                  <Send className="h-4 w-4" />
                  <span>{isLoading ? 'Creating Invitation...' : 'Send Circle Invitation'}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: Magic Share Link */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-2 leading-relaxed">
                Share this link via chat or email. Anyone who opens it can join your Circle Roster with one click:
              </p>
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-2.5">
                <input
                  type="text"
                  readOnly
                  value={defaultLink}
                  className="flex-1 text-[11px] font-mono text-[var(--text-primary)] bg-transparent focus:outline-none truncate"
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink(defaultLink)}
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] text-white px-3.5 py-2 text-xs font-bold shrink-0 shadow-xs transition active:scale-95"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="pt-2 border-t border-[var(--border-subtle)]">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] mb-2 block">
                Quick Share via:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] p-2.5 text-xs font-semibold text-[var(--text-primary)] transition"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-500" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`mailto:?subject=${encodeURIComponent('Join my Taktic Focus Circle')}&body=${encodeURIComponent(shareText)}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] p-2.5 text-xs font-semibold text-[var(--text-primary)] transition"
                >
                  <Mail className="h-4 w-4 text-[var(--accent-terracotta)]" />
                  <span>Email App</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Callout Banner */}
        <div className="mt-5 rounded-2xl border border-[var(--accent-botanical-sage)]/30 bg-[var(--accent-botanical-sage)]/10 p-3 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-[var(--accent-botanical-sage)] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[var(--text-primary)] leading-snug">
            <span className="font-bold text-[var(--accent-botanical-sage)]">Privacy Protected: </span>
            Streak milestones and ring closures are shared. Task names and notes stay private.
          </p>
        </div>
      </div>
    </div>
  );
};
