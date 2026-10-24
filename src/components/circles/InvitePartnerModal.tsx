import React, { useState } from 'react';
import { X, Mail, Link as LinkIcon, Copy, Check, UserPlus, Send, MessageCircle } from 'lucide-react';

interface InvitePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendInvite: (email: string, name?: string) => Promise<{ success: boolean; inviteLink: string; message: string }>;
  onGenerateMagicLink: () => { token: string; link: string };
  currentUserEmail?: string;
}

export const InvitePartnerModal: React.FC<InvitePartnerModalProps> = ({
  isOpen,
  onClose,
  onSendInvite,
  onGenerateMagicLink,
  currentUserEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'email' | 'link'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ link: string; email: string } | null>(null);

  if (!isOpen) return null;

  const defaultLink = onGenerateMagicLink().link;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) return;

    if (currentUserEmail && targetEmail === currentUserEmail.trim().toLowerCase()) {
      setErrorMessage("You cannot invite yourself! Please enter a colleague or friend's email.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await onSendInvite(targetEmail, name.trim() || undefined);
      if (result.success) {
        setSuccessInfo({ link: result.inviteLink, email: targetEmail });
        setEmail('');
        setName('');
        setErrorMessage(null);
      } else {
        setErrorMessage(result.message || 'Failed to send invitation. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Something went wrong while sending the invitation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (linkToCopy: string) => {
    navigator.clipboard.writeText(linkToCopy);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareText = `Let's connect on Taktic: ${defaultLink}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl md:max-w-2xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition p-1.5 rounded-lg hover:bg-[var(--card-hover)] cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Body: Responsive Layout (Horizontal for Tablet & Desktop, Vertical for Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[320px]">
          {/* Left Column (Desktop/Tablet): Context & Mode Switcher */}
          <div className="md:col-span-5 p-5 md:p-6 bg-[var(--surface-sunken)]/60 border-b md:border-b-0 md:border-r border-[var(--border-subtle)] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] font-bold shrink-0">
                  <UserPlus className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[var(--text-primary)] leading-tight">
                    Invite Partner
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Share daily progress and goals.
                  </p>
                </div>
              </div>

              {/* Segmented Mode Selector */}
              <div className="mt-4 flex flex-row md:flex-col gap-1 p-1 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('email');
                    setSuccessInfo(null);
                  }}
                  className={`flex-1 flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'email'
                      ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-2xs font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Mail className="h-3.5 w-3.5 text-[var(--accent-terracotta)]" />
                  <span>Send by Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('link');
                    setSuccessInfo(null);
                  }}
                  className={`flex-1 flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'link'
                      ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-2xs font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <LinkIcon className="h-3.5 w-3.5 text-[var(--accent-warm-ochre)]" />
                  <span>Share Invite Link</span>
                </button>
              </div>
            </div>

            {/* Quick Share Links (Left Bottom on Desktop) */}
            <div className="hidden md:block pt-4 border-t border-[var(--border-subtle)] mt-6">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                Quick Share
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] py-1.5 px-2 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent('Join me on Taktic')}&body=${encodeURIComponent(shareText)}`}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] py-1.5 px-2 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                >
                  <Mail className="h-3.5 w-3.5 text-[var(--accent-terracotta)]" />
                  <span>Email</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Form / Content */}
          <div className="md:col-span-7 p-5 md:p-6 flex flex-col justify-center">
            {/* TAB 1: Email Form */}
            {activeTab === 'email' && (
              <div>
                {successInfo ? (
                  <div className="space-y-3 rounded-xl border border-[var(--accent-botanical-sage)]/25 bg-[var(--accent-botanical-sage)]/5 p-4 text-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-botanical-sage)]/20 text-[var(--accent-botanical-sage)] mx-auto">
                      <Check className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-xs text-[var(--text-primary)]">
                        Invite Created for {successInfo.email}
                      </h4>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        Share this link directly or they can use their email.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] p-1.5">
                      <input
                        id="invite-success-link"
                        name="successInviteLink"
                        type="text"
                        readOnly
                        value={successInfo.link}
                        aria-label="Invitation link"
                        className="flex-1 text-[11px] font-mono text-[var(--text-secondary)] bg-transparent focus:outline-none truncate pl-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyLink(successInfo.link)}
                        className="flex items-center gap-1 rounded-md bg-[var(--accent-terracotta)] text-white px-2.5 py-1 text-xs font-semibold shrink-0 cursor-pointer"
                      >
                        {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSuccessInfo(null)}
                      className="text-[11px] font-semibold text-[var(--accent-terracotta)] hover:underline cursor-pointer"
                    >
                      Invite someone else
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                    {errorMessage && (
                      <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-2.5 text-xs text-red-600 dark:text-red-400">
                        {errorMessage}
                      </div>
                    )}

                    <div>
                      <label htmlFor="partner-email" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                        Email Address <span className="text-[var(--accent-terracotta)]">*</span>
                      </label>
                      <input
                        id="partner-email"
                        name="partnerEmail"
                        type="email"
                        required
                        placeholder="colleague@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none min-h-[38px] transition"
                      />
                    </div>

                    <div>
                      <label htmlFor="partner-name" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                        Name <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                      </label>
                      <input
                        id="partner-name"
                        name="partnerName"
                        type="text"
                        placeholder="Alex"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none min-h-[38px] transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !email.trim()}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-4 py-2 text-xs font-bold text-white shadow-2xs transition disabled:opacity-50 min-h-[38px] active:scale-98 cursor-pointer mt-1"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{isLoading ? 'Sending...' : 'Send Invite'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: Direct Link Share */}
            {activeTab === 'link' && (
              <div className="space-y-3.5">
                <div>
                  <label htmlFor="magic-share-link-input" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    Direct Invite Link
                  </label>
                  <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-1.5">
                    <input
                      id="magic-share-link-input"
                      name="magicShareLink"
                      type="text"
                      readOnly
                      value={defaultLink}
                      aria-label="Invite link"
                      className="flex-1 text-[11px] font-mono text-[var(--text-primary)] bg-transparent focus:outline-none truncate pl-2"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyLink(defaultLink)}
                      className="flex items-center gap-1 rounded-lg bg-[var(--accent-terracotta)] text-white px-3 py-1.5 text-xs font-semibold shrink-0 shadow-2xs transition active:scale-95 cursor-pointer"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-2">
                    Anyone with this link can connect with you as a partner.
                  </p>
                </div>

                {/* Mobile Quick Share (shown on mobile, hidden on md+) */}
                <div className="block md:hidden pt-3 border-t border-[var(--border-subtle)]">
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                    Quick Share
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] p-2 text-xs font-medium text-[var(--text-secondary)]"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={`mailto:?subject=${encodeURIComponent('Join me on Taktic')}&body=${encodeURIComponent(shareText)}`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] p-2 text-xs font-medium text-[var(--text-secondary)]"
                    >
                      <Mail className="h-3.5 w-3.5 text-[var(--accent-terracotta)]" />
                      <span>Email</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

