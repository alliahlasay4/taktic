// Web Audio API Synthesizer for Ambient Soundscapes & Haptic Micro-Sounds

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private currentSoundscape: string | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.5;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = vol;
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(vol * 0.15, this.ctx?.currentTime || 0, 0.1);
    }
  }

  public playSoundscape(name: string) {
    this.initCtx();
    if (!this.ctx) return;

    if (this.isPlaying) {
      this.stopSoundscape();
    }

    this.currentSoundscape = name;
    this.isPlaying = true;

    if (name === 'Gentle Rain') {
      this.createRainSound();
    } else if (name === 'Ocean Waves') {
      this.createOceanSound();
    } else if (name === 'Lo-Fi Autumn Beats') {
      this.createLofiWarmth();
    } else if (name === 'Coffee Shop Ambience') {
      this.createCafeSound();
    }
  }

  public stopSoundscape() {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      setTimeout(() => {
        try {
          this.noiseNode?.disconnect();
          this.gainNode?.disconnect();
          this.filterNode?.disconnect();
        } catch {
          // Ignore unhandled disconnect errors
        }
        this.isPlaying = false;
        this.currentSoundscape = null;
      }, 250);
    } else {
      this.isPlaying = false;
      this.currentSoundscape = null;
    }
  }

  public getCurrentSoundscape(): string | null {
    return this.isPlaying ? this.currentSoundscape : null;
  }

  public playCheckoffSound() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.08); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, this.ctx.currentTime + 0.16); // G5

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  public playTimerCompleteSound() {
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major Chord Arbor
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      const startTime = this.ctx.currentTime + idx * 0.12;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.8);
    });
  }

  private createRainSound() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // Pink noise
      b6 = white * 0.115926;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 1000;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume * 0.15, this.ctx.currentTime);

    noise.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    noise.start();
    this.noiseNode = noise;
  }

  private createOceanSound() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 400;

    // LFO for ocean wave swells
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.12; // 8 second cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 350;

    lfo.connect(lfoGain);
    lfoGain.connect(this.filterNode.frequency);

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume * 0.2, this.ctx.currentTime);

    noise.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    noise.start();
    lfo.start();
    this.noiseNode = noise;
  }

  private createLofiWarmth() {
    if (!this.ctx) return;
    // Low drone + soft vinyl warmth hum
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 110; // A2 note low warmth

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 350;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume * 0.1, this.ctx.currentTime);

    osc.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    osc.start();
    this.noiseNode = osc;
  }

  private createCafeSound() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.08;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'bandpass';
    this.filterNode.frequency.value = 800;
    this.filterNode.Q.value = 2;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume * 0.12, this.ctx.currentTime);

    noise.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    noise.start();
    this.noiseNode = noise;
  }
}

export const soundEngine = new SoundEngine();
