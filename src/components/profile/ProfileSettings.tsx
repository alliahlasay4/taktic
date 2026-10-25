import React, { useState, useRef } from 'react';
import { UserProfile } from '../../types';
import { ToggleSwitch } from './ToggleSwitch';
import { 
  User, 
  Clock, 
  Shield, 
  Save, 
  Check, 
  Upload,
  Camera, 
  Globe,
  FileText,
  Lock,
} from 'lucide-react';
import { LegalModal, LegalTab } from '../common/LegalModal';

interface ProfileSettingsProps {
  profile: UserProfile;
  onSave: (updated: Partial<UserProfile>) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];


const TIMEZONE_OPTIONS = [
  'GMT+8 (Asia/Manila)',
  'GMT+8 (Asia/Singapore)',
  'GMT+9 (Asia/Tokyo)',
  'GMT+0 (Europe/London)',
  'GMT-5 (America/New_York)',
  'GMT-8 (America/Los_Angeles)',
];

type SettingsSection = 'identity' | 'routine' | 'privacy';

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ profile, onSave }) => {
  const [section, setSection] = useState<SettingsSection>('identity');
  const [fullName, setFullName] = useState(profile.fullName);
  const [username, setUsername] = useState(profile.username);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [bio, setBio] = useState(profile.bio || '');
  const [timezone, setTimezone] = useState(profile.timezone || TIMEZONE_OPTIONS[0]);
  const [workHoursStart, setWorkHoursStart] = useState(profile.workHoursStart || '09:00');
  const [workHoursEnd, setWorkHoursEnd] = useState(profile.workHoursEnd || '17:00');
  const [privacySettings, setPrivacySettings] = useState(profile.privacySettings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('privacy');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
      alert('Please select a valid image file (JPG, PNG, WEBP, or GIF).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Avatar file is too large. Please select an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(compressedDataUrl);
        } else {
          setAvatarUrl(dataUrl);
        }
      };
      img.onerror = () => {
        alert('Could not decode the selected image file.');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      fullName,
      username,
      avatarUrl,
      bio,
      timezone,
      workHoursStart,
      workHoursEnd,
      privacySettings,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
      {/* Settings Sub-Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] w-fit">
        <button
          type="button"
          onClick={() => setSection('identity')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            section === 'identity'
              ? 'bg-[var(--accent-terracotta)] text-white shadow-2xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile Info</span>
        </button>

        <button
          type="button"
          onClick={() => setSection('routine')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            section === 'routine'
              ? 'bg-[var(--accent-terracotta)] text-white shadow-2xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Routine & Hours</span>
        </button>

        <button
          type="button"
          onClick={() => setSection('privacy')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            section === 'privacy'
              ? 'bg-[var(--accent-terracotta)] text-white shadow-2xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Privacy & Badges</span>
        </button>
      </div>

      {/* Main Form Body */}
      <div className="rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] p-5 sm:p-6 transition-colors duration-300">
        {/* Section 1: Public Identity */}
        {section === 'identity' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Avatar Row */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-[var(--border-subtle)]/70">
              <div
                className="relative group cursor-pointer shrink-0"
                onClick={() => fileInputRef.current?.click()}
                title="Change picture"
              >
                <img
                  src={avatarUrl}
                  alt="Avatar Preview"
                  className="w-12 h-12 rounded-xl object-cover border border-[var(--border-subtle)] shadow-2xs group-hover:brightness-95 transition"
                />
                <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition duration-200">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-hover)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold cursor-pointer transition-all"
                >
                  <Upload className="w-3 h-3 text-[var(--accent-terracotta)]" />
                  <span>Upload</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex items-center gap-1">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(preset)}
                      className={`w-7 h-7 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        avatarUrl === preset
                          ? 'border-[var(--accent-terracotta)] ring-1 ring-[var(--accent-terracotta)]'
                          : 'border-[var(--border-subtle)] opacity-50 hover:opacity-100'
                      }`}
                      title={`Preset ${idx + 1}`}
                    >
                      <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Basic Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="profile-full-name" className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                  Full Name
                </label>
                <input
                  id="profile-full-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs sm:text-sm focus:border-[var(--accent-terracotta)] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label htmlFor="profile-username" className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                  Username Handle
                </label>
                <input
                  id="profile-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs sm:text-sm focus:border-[var(--accent-terracotta)] focus:outline-none transition-colors font-mono"
                />
              </div>
            </div>



            {/* Bio */}
            <div>
              <label htmlFor="profile-bio" className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                Bio
              </label>
              <textarea
                id="profile-bio"
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short note about your focus routine..."
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs sm:text-sm focus:border-[var(--accent-terracotta)] focus:outline-none transition-colors resize-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Section 2: Routine & Work Window */}
        {section === 'routine' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label htmlFor="profile-timezone" className="text-xs font-medium text-[var(--text-secondary)] block mb-1 flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-[var(--accent-terracotta)]" strokeWidth={1.5} />
                Timezone
              </label>
              <select
                id="profile-timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs sm:text-sm focus:border-[var(--accent-terracotta)] focus:outline-none cursor-pointer"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="profile-work-hours-start" className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                  Focus Window Starts
                </label>
                <input
                  id="profile-work-hours-start"
                  type="time"
                  value={workHoursStart}
                  onChange={(e) => setWorkHoursStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs sm:text-sm focus:border-[var(--accent-terracotta)] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="profile-work-hours-end" className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                  Focus Window Ends
                </label>
                <input
                  id="profile-work-hours-end"
                  type="time"
                  value={workHoursEnd}
                  onChange={(e) => setWorkHoursEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs sm:text-sm focus:border-[var(--accent-terracotta)] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Privacy & Visibility Controls */}
        {section === 'privacy' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="divide-y divide-[var(--border-subtle)]/70">
              {[
                {
                  key: 'isIncognito',
                  label: 'Incognito Mode',
                  desc: 'Hide presence and appear offline in circles.',
                  badge: 'Stealth',
                },
                {
                  key: 'showFocusHours',
                  label: 'Show Deep Focus Hours',
                  desc: 'Display accumulated hours on your profile.',
                },
                {
                  key: 'showStreak',
                  label: 'Show Streak Milestones',
                  desc: 'Display streak days to partners.',
                },
                {
                  key: 'showActivityFeed',
                  label: 'Auto-Post Closed Rings',
                  desc: 'Share ring completions to circle feed.',
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="pr-4">
                    <div className="text-xs sm:text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{item.desc}</div>
                  </div>
                  <ToggleSwitch
                    checked={Boolean((privacySettings as any)[item.key])}
                    onChange={(checked) =>
                      setPrivacySettings((prev) => ({
                        ...prev,
                        [item.key]: checked,
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            {/* Legal Agreement & Data Rights Card */}
            <div className="mt-4 p-3.5 rounded-2xl bg-[var(--card-hover)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-[#C06C4C]/10 text-[#C06C4C]">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">
                      Data Privacy & Agreements
                    </h4>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Review how your rhythm, habits, and circle presence are safeguarded.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-[var(--border-subtle)]/70">
                <button
                  type="button"
                  onClick={() => {
                    setLegalModalTab('privacy');
                    setLegalModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Lock className="w-3 h-3 text-[#C06C4C]" />
                  <span>Privacy Policy</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLegalModalTab('terms');
                    setLegalModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer transition"
                >
                  <FileText className="w-3 h-3 text-[#C06C4C]" />
                  <span>Terms of Service</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <LegalModal
          isOpen={legalModalOpen}
          onClose={() => setLegalModalOpen(false)}
          initialTab={legalModalTab}
        />

        {/* Footer Save Row */}
        <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-[var(--border-subtle)]">
          <div>
            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-terracotta)] hover:opacity-90 text-white font-medium text-xs sm:text-sm transition-all shadow-xs active:scale-95 cursor-pointer ml-auto"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </form>
  );
};
