// Emergency Siren Audio Engine using Web Audio API
// Synthesizes a loud, high-decibel dual-oscillator emergency siren with LFO pitch sweep

class EmergencySirenService {
  private audioCtx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;

  private initAudioContext() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public startSiren() {
    if (this.isPlaying) return;
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Master Gain Node for clear loud emergency siren volume
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0.4, now);
      this.gainNode.connect(this.audioCtx.destination);

      // Primary Siren Oscillator (Sawtooth wave for sharp penetration)
      this.osc1 = this.audioCtx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(800, now);

      // Secondary Harmonics Oscillator (Square wave for alarm harmonics)
      this.osc2 = this.audioCtx.createOscillator();
      this.osc2.type = 'square';
      this.osc2.frequency.setValueAtTime(1050, now);

      // Low Frequency Oscillator for Siren Pitch Wail modulation (3.2 Hz pitch sweep)
      this.lfo = this.audioCtx.createOscillator();
      this.lfo.type = 'sine';
      this.lfo.frequency.setValueAtTime(3.2, now);

      const lfoGain = this.audioCtx.createGain();
      lfoGain.gain.setValueAtTime(400, now); // Sweep between ~400Hz and ~1200Hz

      // Connect LFO to pitch modulation
      this.lfo.connect(lfoGain);
      lfoGain.connect(this.osc1.frequency);
      lfoGain.connect(this.osc2.frequency);

      // Connect Oscillators to Master Gain
      this.osc1.connect(this.gainNode);
      this.osc2.connect(this.gainNode);

      // Start sound oscillators
      this.lfo.start(now);
      this.osc1.start(now);
      this.osc2.start(now);

      this.isPlaying = true;
    } catch (err) {
      console.warn('Emergency Siren AudioContext error:', err);
    }
  }

  public stopSiren() {
    if (!this.isPlaying) return;
    try {
      const now = this.audioCtx ? this.audioCtx.currentTime : 0;
      if (this.gainNode && this.audioCtx) {
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      }
      setTimeout(() => {
        if (this.osc1) {
          try { this.osc1.stop(); this.osc1.disconnect(); } catch {}
        }
        if (this.osc2) {
          try { this.osc2.stop(); this.osc2.disconnect(); } catch {}
        }
        if (this.lfo) {
          try { this.lfo.stop(); this.lfo.disconnect(); } catch {}
        }
        if (this.gainNode) {
          try { this.gainNode.disconnect(); } catch {}
        }
        this.osc1 = null;
        this.osc2 = null;
        this.lfo = null;
        this.gainNode = null;
        this.isPlaying = false;
      }, 160);
    } catch (err) {
      console.warn('Error stopping siren:', err);
      this.isPlaying = false;
    }
  }

  public toggleSiren(): boolean {
    if (this.isPlaying) {
      this.stopSiren();
    } else {
      this.startSiren();
    }
    return this.isPlaying;
  }

  public playAlertBeep() {
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (err) {
      console.warn('Alert beep error:', err);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioService = new EmergencySirenService();
