import React, { useState } from 'react';
import { Volume2, VolumeX, Volume1, Music, Square } from 'lucide-react';
import { soundEngine } from '../../lib/audio';

interface AmbientSoundCardProps {
  activeSoundscape: string | null;
  setActiveSoundscape: (sound: string | null) => void;
}

const SOUNDSCAPES = [
  { id: 'Gentle Rain', label: 'Gentle Rain', icon: '🌧️', desc: 'Soft rainfall' },
  { id: 'Ocean Waves', label: 'Ocean Waves', icon: '🌊', desc: 'Shoreline waves' },
  { id: 'Lo-Fi Autumn Beats', label: 'Lo-Fi Warmth', icon: '🎧', desc: 'Vinyl hum' },
  { id: 'Coffee Shop Ambience', label: 'Cafe Chatter', icon: '☕', desc: 'Cafe ambience' },
];

export const AmbientSoundCard: React.FC<AmbientSoundCardProps> = ({
  activeSoundscape,
  setActiveSoundscape,
}) => {
  const [volume, setVolume] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);

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
      soundEngine.setVolume(volume);
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
      soundEngine.playSoundscape(soundId);
      setActiveSoundscape(soundId);
      if (isMuted) {
        setIsMuted(false);
        soundEngine.setVolume(volume);
      }
    }
  };

  const handleStopAll = () => {
    soundEngine.stopSoundscape();
    setActiveSoundscape(null);
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-md transition-all">
      {/* Top Header Row with Title, Playing Indicator & Integrated Master Volume Slider */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#CFA052]/15 text-[#CFA052] shrink-0">
            <Music className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                Ambient Soundscapes
              </h3>
              {activeSoundscape && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Playing
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Background sound synthesizer for deep focus
            </p>
          </div>
        </div>

        {/* Master Volume Slider & Controls */}
        <div className="flex items-center gap-3 bg-[var(--bg-main)]/70 px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)]">
          <button
            onClick={handleToggleMute}
            className="text-[var(--text-secondary)] hover:text-[#CFA052] transition p-0.5"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon className={`h-4 w-4 ${isMuted ? 'text-red-400' : 'text-[#CFA052]'}`} />
          </button>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-24 sm:w-28 h-1.5 rounded-lg appearance-none bg-gray-800 accent-[#CFA052] cursor-pointer"
            />
            <span className="font-mono text-[11px] font-bold text-[#CFA052] w-8 text-right">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>

          {activeSoundscape && (
            <button
              onClick={handleStopAll}
              className="ml-1 flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-500/20 transition active:scale-95"
              title="Stop Soundscape"
            >
              <Square className="h-3 w-3 fill-red-400" />
              <span>Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Soundscape Selector Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {SOUNDSCAPES.map((sound) => {
          const isActive = activeSoundscape === sound.id;
          return (
            <button
              key={sound.id}
              onClick={() => handleSelectSoundscape(sound.id)}
              className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
                isActive
                  ? 'border-[#CFA052] bg-[#CFA052]/15 text-[#CFA052] shadow-sm ring-1 ring-[#CFA052]/30 scale-[1.02]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:border-gray-700 hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="text-lg p-0.5 shrink-0">{sound.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-xs truncate">{sound.label}</p>
                  {isActive && (
                    <span className="flex h-2 w-2 rounded-full bg-[#CFA052] animate-pulse shrink-0 ml-1" />
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

