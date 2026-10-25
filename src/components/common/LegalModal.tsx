import React, { useState } from 'react';
import {
  X,
  Shield,
  FileText,
  Lock,
  HardDrive,
  UserCheck,
  Compass,
  Users,
  ShieldAlert,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { PRIVACY_POLICY, TERMS_OF_SERVICE, LegalDocument } from '../../lib/legalContent';
import { TakticLogo } from './TakticLogo';

export type LegalTab = 'privacy' | 'terms';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
  onAccept,
  showAcceptButton = false,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  if (!isOpen) return null;

  const doc: LegalDocument = activeTab === 'privacy' ? PRIVACY_POLICY : TERMS_OF_SERVICE;

  const renderIcon = (name: string) => {
    const props = { className: 'w-4 h-4 text-[#C06C4C]' };
    switch (name) {
      case 'Shield':
        return <Shield {...props} />;
      case 'Lock':
        return <Lock {...props} />;
      case 'HardDrive':
        return <HardDrive {...props} />;
      case 'UserCheck':
        return <UserCheck {...props} />;
      case 'Compass':
        return <Compass {...props} />;
      case 'Users':
        return <Users {...props} />;
      case 'ShieldAlert':
        return <ShieldAlert {...props} />;
      default:
        return <FileText {...props} />;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] px-6 py-5 text-white flex-shrink-0">
          <div className="flex items-center justify-between pb-3">
            <TakticLogo size="sm" showText={true} />
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              title="Close"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 id="legal-modal-title" className="text-xl sm:text-2xl font-bold tracking-tight">
                {activeTab === 'privacy' ? 'Privacy Policy & Data Rights' : 'Terms of Service'}
              </h2>
              <p className="text-xs text-white/85 mt-0.5">
                Last updated: {doc.lastUpdated} • Taktic Platform Agreement
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-medium cursor-pointer transition"
              title="Print policy"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Tab Navigator */}
        <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-main)] px-6 pt-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'privacy'
                ? 'border-[#C06C4C] text-[#C06C4C]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'terms'
                ? 'border-[#C06C4C] text-[#C06C4C]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-[var(--text-primary)] text-xs sm:text-sm leading-relaxed">
          {/* Highlights Box */}
          <div className="p-4 rounded-2xl bg-[var(--card-hover)] border border-[var(--border-subtle)] space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C06C4C]" />
              <span>Key Commitments at a Glance</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {doc.summaryHighlights.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 rounded-md bg-[#C06C4C]/10 flex-shrink-0">
                    {renderIcon(item.icon)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-[var(--text-primary)]">{item.title}</h4>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full Sections */}
          <div className="space-y-5">
            {doc.sections.map((section, idx) => (
              <div key={idx} className="space-y-1.5">
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  {section.title}
                </h3>
                {section.content.map((p, pIdx) => (
                  <p key={pIdx} className="text-[var(--text-secondary)] text-xs leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>Taktic Calm Workspace • All Rights Reserved</span>
            <span className="flex items-center gap-1">
              GDPR & CCPA Compliant
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-main)] flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-[var(--text-muted)] hidden sm:block">
            Questions? Contact <span className="text-[#C06C4C]">privacy@taktic.app</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--card-hover)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer transition"
            >
              Close
            </button>
            {showAcceptButton && onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#C06C4C] to-[#CFA052] text-white text-xs font-bold shadow-sm hover:opacity-95 cursor-pointer transition"
              >
                I Agree & Accept
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
