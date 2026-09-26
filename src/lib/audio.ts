// Robust Web Audio API Synthesizer for Ambient Soundscapes & Haptic Micro-Sounds

type SoundscapeType = 'Gentle Rain' | 'Ocean Waves' | 'Warm Chords' | 'Coffee Shop Ambience' | 'Lo-Fi Autumn Beats';

interface ActiveSoundSession {
  id: number;
  gainNode: GainNode;
  cleanup: () => void;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentSession: ActiveSoundSession | null = null;
  private currentSoundscape: string | null = null;
  private volume: number = 0.7;
  private sessionCounter: number = 0;
  private isUnlocked: boolean = false;

  constructor() {
    // Attempt auto-unlock on first user interaction if in browser
    if (typeof window !== 'undefined') {
      const savedVol = localStorage.getItem('taktic_ambient_volume');
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.volume = parsed;
        }
      }

      const unlock = () => {
        if (!this.isUnlocked) {
          this.initCtx();
          if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => { });
          }
          this.isUnlocked = true;
        }
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
  }

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      } catch (err) {
        console.warn('Web Audio API not supported or blocked:', err);
        return null;
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => { });
    }

    return this.ctx;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      localStorage.setItem('taktic_ambient_volume', String(this.volume));
    }
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(this.volume, now, 0.05);
    }
  }

  public playSoundscape(name: string) {
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => { });
    }

    // If already playing the same sound, do nothing
    if (this.currentSoundscape === name && this.currentSession) {
      return;
    }

    // Stop and cleanly fade out any previous sound session immediately
    this.stopSoundscapeSync(true);

    const sessionId = ++this.sessionCounter;
    this.currentSoundscape = name;

    // Create a dedicated sub-gain for this sound session to allow smooth fading without startup dead air
    const sessionGain = ctx.createGain();
    const now = ctx.currentTime;
    sessionGain.gain.setValueAtTime(0.5, now);
    sessionGain.gain.linearRampToValueAtTime(1.0, now + 0.04);
    sessionGain.connect(this.masterGain);

    let cleanup = () => { };

    try {
      if (name === 'Gentle Rain') {
        cleanup = this.createRainSound(ctx, sessionGain, sessionId);
      } else if (name === 'Ocean Waves') {
        cleanup = this.createOceanSound(ctx, sessionGain, sessionId);
      } else if (name === 'Warm Chords' || name === 'Lo-Fi Autumn Beats' || name === 'Lo-Fi Warmth' || name === 'Lo-Fi') {
        cleanup = this.createLofiWarmth(ctx, sessionGain, sessionId);
      } else if (name === 'Coffee Shop Ambience') {
        cleanup = this.createCafeSound(ctx, sessionGain, sessionId);
      }
    } catch (err) {
      console.error('Error starting soundscape:', err);
      this.stopSoundscape();
      return;
    }

    this.currentSession = {
      id: sessionId,
      gainNode: sessionGain,
      cleanup,
    };
  }

  private stopSoundscapeSync(isCrossfade: boolean = false) {
    if (!this.currentSession) {
      this.currentSoundscape = null;
      return;
    }

    const sessionToStop = this.currentSession;
    this.currentSession = null;
    if (!isCrossfade) {
      this.currentSoundscape = null;
    }

    if (this.ctx && sessionToStop.gainNode) {
      try {
        const now = this.ctx.currentTime;
        sessionToStop.gainNode.gain.cancelScheduledValues(now);
        sessionToStop.gainNode.gain.setValueAtTime(sessionToStop.gainNode.gain.value, now);
        sessionToStop.gainNode.gain.linearRampToValueAtTime(0.0001, now + (isCrossfade ? 0.08 : 0.15));

        setTimeout(() => {
          try {
            sessionToStop.cleanup();
            sessionToStop.gainNode.disconnect();
          } catch {
            // Ignore disconnect errors
          }
        }, isCrossfade ? 90 : 160);
      } catch {
        sessionToStop.cleanup();
      }
    } else {
      sessionToStop.cleanup();
    }
  }

  public stopSoundscape() {
    this.stopSoundscapeSync(false);
  }

  public getCurrentSoundscape(): string | null {
    return this.currentSession ? this.currentSoundscape : null;
  }

  // Checkoff Micro-Sound (Light cheerful ascending chime)
  public playCheckoffSound() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.16); // G5

      const targetGain = Math.max(0.1, this.volume * 0.25);
      gain.gain.setValueAtTime(targetGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Ignore audio synthesis errors on checkoff
    }
  }

  // Celebration & Confetti Accomplishment Fanfare (Rich sparkling arpeggiated chime chord)
  public playCelebrationSound() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      // Shimmering ascending arpeggio: C5, E5, G5, B5, C6, E6
      const fanfareNotes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51];
      const now = ctx.currentTime;
      const targetVol = Math.max(0.12, this.volume * 0.28);

      fanfareNotes.forEach((freq, idx) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === fanfareNotes.length - 1 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        const startTime = now + idx * 0.07;
        const noteDuration = 0.85;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(targetVol, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + noteDuration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + noteDuration + 0.05);
      });
    } catch {
      // Ignore celebration audio synthesis errors
    }
  }

  // Timer Complete Bell Sound
  public playTimerCompleteSound() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C Major Chord
      notes.forEach((freq, idx) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + idx * 0.12;
        const targetVol = Math.max(0.12, this.volume * 0.3);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(targetVol, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.95);
      });
    } catch {
      // Ignore chime errors
    }
  }

  // ==========================================
  // PROCEDURAL SOUNDSCAPE GENERATORS
  // ==========================================

  // 1. Gentle Rain (Layered Pink Noise + Random Droplet Pings)
  private createRainSound(ctx: AudioContext, output: GainNode, sessionId: number): () => void {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.09;
      b6 = white * 0.115926;
    }

    const rainBed = ctx.createBufferSource();
    rainBed.buffer = buffer;
    rainBed.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;

    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.22;

    rainBed.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(output);
    rainBed.start();

    // Occasional gentle water drops
    const dropletInterval = setInterval(() => {
      if (this.currentSession?.id !== sessionId) return;
      if (Math.random() > 0.4) {
        try {
          const dropOsc = ctx.createOscillator();
          const dropGain = ctx.createGain();
          const now = ctx.currentTime;
          const dropFreq = 1800 + Math.random() * 1400;

          dropOsc.type = 'sine';
          dropOsc.frequency.setValueAtTime(dropFreq, now);
          dropOsc.frequency.exponentialRampToValueAtTime(dropFreq * 0.6, now + 0.08);

          dropGain.gain.setValueAtTime(0.015, now);
          dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

          dropOsc.connect(dropGain);
          dropGain.connect(output);

          dropOsc.start(now);
          dropOsc.stop(now + 0.09);
        } catch { }
      }
    }, 320);

    return () => {
      clearInterval(dropletInterval);
      try {
        rainBed.stop();
        rainBed.disconnect();
        filter.disconnect();
        rainGain.disconnect();
      } catch { }
    };
  }

  // 2. Ocean Waves (Dynamic Low-Frequency Swell + Surf Wash)
  private createOceanSound(ctx: AudioContext, output: GainNode, sessionId: number): () => void {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.18;
    }

    const waveSource = ctx.createBufferSource();
    waveSource.buffer = buffer;
    waveSource.loop = true;

    const waveFilter = ctx.createBiquadFilter();
    waveFilter.type = 'lowpass';
    waveFilter.frequency.value = 520;
    waveFilter.Q.value = 1.0;

    // Swell LFO (9-second wave period)
    const swellLfo = ctx.createOscillator();
    swellLfo.type = 'sine';
    swellLfo.frequency.value = 0.11;

    const swellGain = ctx.createGain();
    swellGain.gain.value = 280;

    swellLfo.connect(swellGain);
    swellGain.connect(waveFilter.frequency);

    const masterWaveGain = ctx.createGain();
    masterWaveGain.gain.value = 0.28;

    waveSource.connect(waveFilter);
    waveFilter.connect(masterWaveGain);
    masterWaveGain.connect(output);

    waveSource.start();
    swellLfo.start();

    return () => {
      try {
        waveSource.stop();
        swellLfo.stop();
        waveSource.disconnect();
        swellLfo.disconnect();
        swellGain.disconnect();
        waveFilter.disconnect();
        masterWaveGain.disconnect();
      } catch { }
    };
  }

  // 3. Lo-Fi Autumn Beats (Warm Rhodes Progression + Vinyl Warmth & Sub)
  private createLofiWarmth(ctx: AudioContext, output: GainNode, sessionId: number): () => void {
    // Layer 1: Vinyl Tape Hiss & Subtle Crackle
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.03;
    }
    const vinylSource = ctx.createBufferSource();
    vinylSource.buffer = buffer;
    vinylSource.loop = true;

    const vinylFilter = ctx.createBiquadFilter();
    vinylFilter.type = 'bandpass';
    vinylFilter.frequency.value = 1800;
    vinylFilter.Q.value = 1.0;

    const vinylGain = ctx.createGain();
    vinylGain.gain.value = 0.06;

    vinylSource.connect(vinylFilter);
    vinylFilter.connect(vinylGain);
    vinylGain.connect(output);
    vinylSource.start();

    // Layer 2: Mellow Lo-Fi Chords Loop (Dm9 -> G13 -> Cmaj9 -> Am9)
    const chordProgressions = [
      [146.83, 174.61, 220.0, 261.63, 329.63], // Dm9 (D3, F3, A3, C4, E4)
      [196.0, 246.94, 293.66, 329.63, 440.0],  // G13 (G3, B3, D4, E4, A4)
      [130.81, 164.81, 196.0, 246.94, 293.66], // Cmaj9 (C3, E3, G3, B3, D4)
      [110.0, 164.81, 220.0, 261.63, 329.63],  // Am9 (A2, E3, A3, C4, E4)
    ];

    let chordIndex = 0;
    const activeOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];

    const playNextChord = () => {
      if (this.currentSession?.id !== sessionId) return;

      const chord = chordProgressions[chordIndex];
      chordIndex = (chordIndex + 1) % chordProgressions.length;
      const now = ctx.currentTime;
      const duration = 4.2;

      chord.forEach((freq, idx) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = idx === 0 ? 'sine' : 'triangle';
          // Subtle detune for warm vintage lo-fi chorus
          osc.frequency.value = freq;
          osc.detune.value = (Math.random() - 0.5) * 6;

          const voiceVol = (idx === 0 ? 0.075 : 0.04) * (1 / chord.length) * 3.6;
          gain.gain.setValueAtTime(voiceVol * 0.9, now);
          gain.gain.linearRampToValueAtTime(voiceVol, now + 0.04);
          gain.gain.setTargetAtTime(0.0001, now + duration - 0.7, 0.4);

          osc.connect(gain);
          gain.connect(output);

          osc.start(now);
          osc.stop(now + duration + 0.2);
          activeOscillators.push({ osc, gain });
        } catch { }
      });

      // Cleanup old stopped oscillators
      if (activeOscillators.length > 25) {
        activeOscillators.splice(0, 10).forEach(({ osc, gain }) => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch { }
        });
      }
    };

    playNextChord();
    const chordInterval = setInterval(playNextChord, 4000);

    return () => {
      clearInterval(chordInterval);
      try {
        vinylSource.stop();
        vinylSource.disconnect();
        vinylFilter.disconnect();
        vinylGain.disconnect();
        activeOscillators.forEach(({ osc, gain }) => {
          try {
            osc.stop();
            osc.disconnect();
            gain.disconnect();
          } catch { }
        });
      } catch { }
    };
  }

  // 4. Coffee Shop Ambience (Room Tone Murmur + Soft Cup Clinks)
  private createCafeSound(ctx: AudioContext, output: GainNode, sessionId: number): () => void {
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.12;
    }

    const murmur = ctx.createBufferSource();
    murmur.buffer = buffer;
    murmur.loop = true;

    const murmurFilter = ctx.createBiquadFilter();
    murmurFilter.type = 'bandpass';
    murmurFilter.frequency.value = 650;
    murmurFilter.Q.value = 1.4;

    const murmurGain = ctx.createGain();
    murmurGain.gain.value = 0.2;

    murmur.connect(murmurFilter);
    murmurFilter.connect(murmurGain);
    murmurGain.connect(output);
    murmur.start();

    // Occasional subtle ceramic / glass cup tap
    const clinkInterval = setInterval(() => {
      if (this.currentSession?.id !== sessionId) return;
      if (Math.random() > 0.55) {
        try {
          const clinkOsc = ctx.createOscillator();
          const clinkGain = ctx.createGain();
          const now = ctx.currentTime;
          const clinkFreq = 2400 + Math.random() * 800;

          clinkOsc.type = 'sine';
          clinkOsc.frequency.setValueAtTime(clinkFreq, now);

          clinkGain.gain.setValueAtTime(0.018, now);
          clinkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

          clinkOsc.connect(clinkGain);
          clinkGain.connect(output);

          clinkOsc.start(now);
          clinkOsc.stop(now + 0.14);
        } catch { }
      }
    }, 850);

    return () => {
      clearInterval(clinkInterval);
      try {
        murmur.stop();
        murmur.disconnect();
        murmurFilter.disconnect();
        murmurGain.disconnect();
      } catch { }
    };
  }
}

export const soundEngine = new SoundEngine();
