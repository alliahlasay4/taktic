import React, { useState, useRef } from 'react';
import { UserProfile } from '../../types';
import { ToggleSwitch } from './ToggleSwitch';
import { User, Clock, Shield, Save, Check, Sparkles, Target, Volume2, Upload, Camera, Image as ImageIcon } from 'lucide-react';

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

const SOUNDSCAPE_OPTIONS = ['Gentle Rain', 'Ocean Waves', 'Lo-Fi Autumn Beats', 'Coffee Shop Ambience'];

const TIMEZONE_OPTIONS = [
  'GMT+8 (Asia/Manila)',
  'GMT+8 (Asia/Singapore)',
  'GMT+9 (Asia/Tokyo)',
  'GMT+0 (Europe/London)',
  'GMT-5 (America/New_York)',
  'GMT-8 (America/Los_Angeles)',
];

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ profile, onSave }) => {
  const [fullName, setFullName] = useState(profile.fullName);
  const [username, setUsername] = useState(profile.username);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [bio, setBio] = useState(profile.bio || '');
  const [microGoal, setMicroGoal] = useState(profile.microGoal || '');
  const [statusMessage, setStatusMessage] = useState(profile.statusMessage || '');
  const [timezone, setTimezone] = useState(profile.timezone || TIMEZONE_OPTIONS[0]);
  const [workHoursStart, setWorkHoursStart] = useState(profile.workHoursStart || '09:00');
  const [workHoursEnd, setWorkHoursEnd] = useState(profile.workHoursEnd || '17:00');
  const [favoriteSoundscape, setFavoriteSoundscape] = useState(
    profile.favoriteSoundscape || SOUNDSCAPE_OPTIONS[0]
  );
  const [privacySettings, setPrivacySettings] = useState(profile.privacySettings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (e.g., JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
      }
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
      microGoal,
      statusMessage,
      timezone,
      workHoursStart,
      workHoursEnd,
      favoriteSoundscape,
      privacySettings,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Identity Card */}
      <div className="rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] p-6 space-y-5 transition-colors duration-300">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--border-subtle)]">
          <div className="p-2 rounded-lg bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/30 text-[var(--accent-terracotta)]">
            <User className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Public Identity</h3>
            <p className="text-xs text-[var(--text-secondary)]">Information displayed across your Focus circles and pods.</p>
          </div>
        </div>

        {/* Avatar Picker with File Upload Option */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">Profile Avatar</label>
            <span className="text-[11px] text-[var(--text-muted)]">Upload a photo or choose a preset</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Avatar preview with upload overlay button */}
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              title="Click to upload custom picture"
            >
              <img
                src={avatarUrl}
                alt="Avatar Preview"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[var(--accent-terracotta)] shadow-sm group-hover:opacity-85 transition"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/45 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition duration-200">
                <Camera className="w-4 h-4 mb-0.5" />
                <span className="text-[8px] font-bold uppercase tracking-wider">Change</span>
              </div>
            </div>

            {/* Presets + Custom Upload Button */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/30 text-[var(--accent-terracotta)] hover:bg-[var(--accent-terracotta)] hover:text-white transition-all text-xs font-semibold shadow-xs"
                title="Upload a picture file from your device"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="h-6 w-px bg-[var(--border-subtle)] mx-1 hidden sm:block" />

              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all ${
                    avatarUrl === preset
                      ? 'border-[var(--accent-terracotta)] scale-105 shadow-xs'
                      : 'border-[var(--border-subtle)] hover:border-[var(--text-muted)] opacity-60 hover:opacity-100'
                  }`}
                  title={`Preset Avatar ${idx + 1}`}
                >
                  <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <ImageIcon className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Or paste an image URL..."
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-mono focus:border-[var(--accent-terracotta)] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-full-name" className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Full Name</label>
            <input
              id="profile-full-name"
              name="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-terracotta)] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="profile-username" className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Username Handle</label>
            <input
              id="profile-username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-terracotta)] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-status-message" className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" strokeWidth={1.5} />
              Status Indicator
            </label>
            <input
              id="profile-status-message"
              name="statusMessage"
              type="text"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="e.g. In Deep Flow Mode"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-terracotta)] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="profile-micro-goal" className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" strokeWidth={1.5} />
              Daily Micro-Goal
            </label>
            <input
              id="profile-micro-goal"
              name="microGoal"
              type="text"
              value={microGoal}
              onChange={(e) => setMicroGoal(e.target.value)}
              placeholder="e.g. Complete 3 pomodoros before 2 PM"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-terracotta)] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="profile-bio" className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Bio</label>
          <textarea
            id="profile-bio"
            name="bio"
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short note about your focus routine..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-terracotta)] focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      {/* Routine & Soundscapes Card */}
      <div className="rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] p-6 space-y-4 transition-colors duration-300">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--border-subtle)]">
          <div className="p-2 rounded-lg bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/30 text-[var(--accent-terracotta)]">
            <Clock className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Routine & Audio Preferences</h3>
            <p className="text-xs text-[var(--text-secondary)]">Configure your working hours and preferred ambient soundscape.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-timezone" className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Timezone</label>
            <select
              id="profile-timezone"
              name="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-terracotta)] focus:outline-none"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="profile-soundscape" className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" strokeWidth={1.5} />
              Favorite Soundscape
            </label>
            <select
              id="profile-soundscape"
              name="favoriteSoundscape"
              value={favoriteSoundscape}
              onChange={(e) => setFavoriteSoundscape(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-terracotta)] focus:outline-none"
            >
              {SOUNDSCAPE_OPTIONS.map((snd) => (
                <option key={snd} value={snd}>
                  {snd}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-work-hours-start" className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Work Hours Start</label>
            <input
              id="profile-work-hours-start"
              name="workHoursStart"
              type="time"
              value={workHoursStart}
              onChange={(e) => setWorkHoursStart(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-terracotta)] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="profile-work-hours-end" className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">Work Hours End</label>
            <input
              id="profile-work-hours-end"
              name="workHoursEnd"
              type="time"
              value={workHoursEnd}
              onChange={(e) => setWorkHoursEnd(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-terracotta)] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Privacy & Social Controls */}
      <div className="rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] p-6 space-y-4 transition-colors duration-300">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--border-subtle)]">
          <div className="p-2 rounded-lg bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/30 text-[var(--accent-terracotta)]">
            <Shield className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Privacy & Visibility Controls</h3>
            <p className="text-xs text-[var(--text-secondary)]">Manage what statistics are shared publicly with your Circles.</p>
          </div>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {[
            {
              key: 'showFocusHours',
              label: 'Display Total Deep Focus Hours',
              desc: 'Share your total focused hours on your public profile banner.',
            },
            {
              key: 'showMicroGoal',
              label: 'Display Daily Micro-Goal',
              desc: 'Show your current micro-goal badge on your header banner.',
            },
            {
              key: 'showStreak',
              label: 'Display Streak Badges',
              desc: 'Broadcast active day streaks to your Circle partners.',
            },
            {
              key: 'showActivityFeed',
              label: 'Auto-Post Closed Rings',
              desc: 'Publish a feed update whenever all daily focus rings are closed.',
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3.5 first:pt-1 last:pb-0">
              <div className="pr-4">
                <div className="text-sm font-medium text-[var(--text-primary)]">{item.label}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5">{item.desc}</div>
              </div>
              <ToggleSwitch
                checked={(privacySettings as any)[item.key]}
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
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {savedSuccess && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl animate-in fade-in">
            <Check className="w-4 h-4" />
            Changes saved successfully
          </div>
        )}

        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-terracotta)] hover:opacity-90 text-white font-medium text-sm transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </form>
  );
};
