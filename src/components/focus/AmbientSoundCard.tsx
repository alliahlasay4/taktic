import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Volume1, Music, Square, CloudRain, Waves, Headphones, Coffee, Play, Pause } from 'lucide-react';
import { soundEngine } from '../../lib/audio';

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
  const [volume, setVolume] = useState<number>(() => soundEngine.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    const currentVol = soundEngine.getVolume();
    setVolume(currentVol);
  }, []);

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
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs transition-colors duration-300">
      {/* Top Header Row with Title, Playing Indicator & Integrated Master Volume Slider */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] shrink-0">
            <Music className="h-4.5 w-4.5" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                Ambient Soundscapes
              </h3>
              {activeSoundscape && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                  <span className="flex items-center gap-0.5">
                    <span className="h-2 w-0.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-3 w-0.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-0.5 bg-emerald-500 rounded-full animate-bounce" />
                  </span>
                  Playing {activeSoundscape}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Procedural Web Audio soundscapes for deep focus
            </p>
          </div>
        </div>

        {/* Master Volume Slider & Controls */}
        <div className="flex items-center gap-3 bg-[var(--bg-main)] px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)] self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={handleToggleMute}
            className="text-[var(--text-secondary)] hover:text-[var(--accent-terracotta)] transition p-0.5 cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon className={`h-4 w-4 ${isMuted ? 'text-rose-500' : 'text-[var(--accent-terracotta)]'}`} strokeWidth={1.5} />
          </button>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-24 sm:w-28 h-1.5 rounded-lg appearance-none bg-[var(--border-subtle)] accent-[var(--accent-terracotta)] cursor-pointer"
              aria-label="Volume Slider"
            />
            <span className="font-mono text-[11px] font-bold text-[var(--text-primary)] w-8 text-right">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>

          {activeSoundscape && (
            <button
              type="button"
              onClick={handleStopAll}
              className="ml-1 flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition active:scale-95 cursor-pointer"
              title="Stop soundscape"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Soundscape Selector Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {SOUNDSCAPES.map((sound) => {
          const isActive = activeSoundscape === sound.id;
          const SoundIcon = sound.icon;
          return (
            <button
              key={sound.id}
              type="button"
              onClick={() => handleSelectSoundscape(sound.id)}
              aria-pressed={isActive}
              className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all min-h-[48px] cursor-pointer group ${
                isActive
                  ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shadow-xs ring-1 ring-[var(--accent-terracotta)]/30'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors ${
                  isActive ? 'bg-[var(--accent-terracotta)]/25 text-[var(--accent-terracotta)]' : 'bg-[var(--card-surface)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                }`}
              >
                {isActive ? (
                  <Pause className="h-4 w-4 fill-current" strokeWidth={1.5} />
                ) : (
                  <SoundIcon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-xs truncate">{sound.label}</p>
                  {isActive ? (
                    <span className="flex items-center gap-0.5 ml-1">
                      <span className="h-2 w-0.5 bg-[var(--accent-terracotta)] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-3 w-0.5 bg-[var(--accent-terracotta)] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-0.5 bg-[var(--accent-terracotta)] rounded-full animate-bounce" />
                    </span>
                  ) : (
                    <Play className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity ml-1" fill="currentColor" />
                  )}
                </div>
                <p className="text-[10px] opacity-75 truncate mt-0.5">{sound.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};


