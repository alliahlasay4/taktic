import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Volume1, Music, CloudRain, Waves, Headphones, Coffee, Pause, Sparkles } from 'lucide-react';
import { soundEngine } from '../../lib/audio';
import { useTimerState } from '../../context/TimerContext';

interface AmbientSoundCardProps {
  activeSoundscape: string | null;
  setActiveSoundscape: (sound: string | null) => void;
}

const SOUNDSCAPES = [
  { id: 'Gentle Rain', label: 'Gentle Rain', icon: CloudRain, desc: 'Soft rainfall & drops' },
  { id: 'Ocean Waves', label: 'Ocean Waves', icon: Waves, desc: 'Deep rhythmic swells' },
  { id: 'Warm Chords', label: 'Warm Chords', icon: Headphones, desc: 'Mellow Rhodes & gentle pads' },
  { id: 'Coffee Shop Ambience', label: 'Cafe Chatter', icon: Coffee, desc: 'Gentle cafe murmur' },
];

export const AmbientSoundCard: React.FC<AmbientSoundCardProps> = ({
  activeSoundscape,
  setActiveSoundscape,
}) => {
  const { isRunning, mode } = useTimerState();
  const [volume, setVolume] = useState<number>(() => soundEngine.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [autoSync, setAutoSync] = useState<boolean>(() => {
    try {
      return localStorage.getItem('taktic_ambient_autosync') === 'true';
    } catch {
      return false;
    }
  });

  // Remember chosen soundscape so autoSync can re-trigger it when timer starts
  const preferredSoundscapeRef = useRef<string | null>(
    activeSoundscape ||
      (typeof window !== 'undefined' ? localStorage.getItem('taktic_last_soundscape') || 'Gentle Rain' : 'Gentle Rain')
  );

  useEffect(() => {
    const currentVol = soundEngine.getVolume();
    setVolume(currentVol);
  }, []);

  const handleToggleAutoSync = () => {
    const nextVal = !autoSync;
    setAutoSync(nextVal);
    try {
      localStorage.setItem('taktic_ambient_autosync', String(nextVal));
    } catch {
      // ignore
    }
  };

  // Auto-sync audio playback with Timer state (play on focus running, pause on timer pause/break)
  useEffect(() => {
    if (!autoSync) return;

    const isDeepFocus = mode === 'pomodoro' || mode === 'stopwatch';

    if (isRunning && isDeepFocus) {
      const soundToPlay = activeSoundscape || preferredSoundscapeRef.current || 'Gentle Rain';
      if (soundEngine.getCurrentSoundscape() !== soundToPlay) {
        soundEngine.playSoundscape(soundToPlay);
        setActiveSoundscape(soundToPlay);
      }
    } else {
      // Pause soundscape when timer is paused or when in break modes
      if (activeSoundscape) {
        soundEngine.stopSoundscape();
        setActiveSoundscape(null);
      }
    }
  }, [isRunning, mode, autoSync]);

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (isMuted && newVol > 0) {
      setIsMuted(false);
    }
    soundEngine.setVolume(newVol);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      soundEngine.setVolume(volume > 0 ? volume : 0.7);
    } else {
      setIsMuted(true);
      soundEngine.setVolume(0);
    }
  };

  const handleSelectSoundscape = (soundId: string) => {
    preferredSoundscapeRef.current = soundId;
    try {
      localStorage.setItem('taktic_last_soundscape', soundId);
    } catch {
      // ignore
    }

    if (activeSoundscape === soundId) {
      soundEngine.stopSoundscape();
      setActiveSoundscape(null);
    } else {
      if (isMuted) {
        setIsMuted(false);
        soundEngine.setVolume(volume > 0 ? volume : 0.7);
      }
      soundEngine.playSoundscape(soundId);
      setActiveSoundscape(soundId);
    }
  };

  const handleStopAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.stopSoundscape();
    setActiveSoundscape(null);
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 shadow-xs transition-colors duration-300">
      {/* Header with Title & Quick Controls */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] shrink-0">
            <Music className="h-3.5 w-3.5" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xs text-[var(--text-primary)]">
              Ambient Atmosphere
            </h3>
          </div>
          {activeSoundscape && (
            <button
              type="button"
              onClick={handleStopAll}
              className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-600 transition cursor-pointer group"
              title="Click to stop playing"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 group-hover:bg-rose-500 animate-pulse" />
              <span>Playing (Stop)</span>
            </button>
          )}
        </div>

        {/* Auto-sync button & mute */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleAutoSync}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
              autoSync
                ? 'bg-[var(--accent-terracotta)] text-white border-[var(--accent-terracotta)] shadow-2xs'
                : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
            }`}
            title="Automatically start/pause ambient sound with focus timer"
            aria-pressed={autoSync}
          >
            <Sparkles className="h-3 w-3" />
            <span>Auto-sync</span>
          </button>

          <button
            type="button"
            onClick={handleToggleMute}
            className="text-[var(--text-secondary)] hover:text-[var(--accent-terracotta)] transition p-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon className={`h-3.5 w-3.5 ${isMuted ? 'text-rose-500' : 'text-[var(--accent-terracotta)]'}`} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* 2x2 Compact Soundscape Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {SOUNDSCAPES.map((sound) => {
          const isActive = activeSoundscape === sound.id;
          const SoundIcon = sound.icon;
          return (
            <button
              key={sound.id}
              type="button"
              onClick={() => handleSelectSoundscape(sound.id)}
              aria-pressed={isActive}
              className={`flex items-center gap-2 rounded-xl border p-2 text-left transition-all cursor-pointer group ${
                isActive
                  ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shadow-2xs ring-1 ring-[var(--accent-terracotta)]/30'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-colors ${
                  isActive ? 'bg-[var(--accent-terracotta)]/25 text-[var(--accent-terracotta)]' : 'bg-[var(--card-surface)] text-[var(--text-secondary)]'
                }`}
              >
                {isActive ? (
                  <Pause className="h-3.5 w-3.5 fill-current" strokeWidth={1.5} />
                ) : (
                  <SoundIcon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[11px] truncate">{sound.label}</p>
                <p className="text-[9px] opacity-70 truncate">{sound.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Volume slider strip at the bottom */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
        <span className="text-[10px] font-medium">Volume</span>
        <div className="flex items-center gap-2 flex-1 max-w-[140px]">
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1 rounded-lg appearance-none bg-[var(--border-subtle)] accent-[var(--accent-terracotta)] cursor-pointer"
            aria-label="Volume Slider"
          />
          <span className="font-mono text-[10px] w-7 text-right">
            {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
          </span>
        </div>
      </div>
    </div>
  );
};


