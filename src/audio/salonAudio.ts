import { SpecialType } from '../types/game';

class SalonAudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.08,
    delay = 0,
    endFreq?: number
  ) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playSelect() {
    this.playTone(620, 0.07, 'triangle', 0.06, 0, 740);
  }

  public playSwap() {
    this.playTone(420, 0.09, 'sine', 0.06, 0, 560);
  }

  public playInvalidSwap() {
    this.playTone(250, 0.11, 'triangle', 0.06, 0, 190);
    this.playTone(190, 0.11, 'triangle', 0.05, 0.07, 160);
  }

  public playMatch(cascadeDepth: number) {
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 987.77, 1046.5];
    const baseIdx = Math.min(cascadeDepth - 1, scale.length - 3);
    const root = scale[Math.max(0, baseIdx)];
    this.playTone(root, 0.14, 'sine', 0.08, 0);
    this.playTone(root * 1.25, 0.16, 'triangle', 0.06, 0.04);
    this.playTone(root * 1.5, 0.2, 'sine', 0.05, 0.08);
  }

  public playSpecialTrigger(special: SpecialType) {
    if (special === 'line-h' || special === 'line-v') {
      this.playTone(540, 0.24, 'sine', 0.09, 0, 1180);
      this.playTone(880, 0.2, 'triangle', 0.06, 0.04, 1320);
    } else if (special === 'bomb') {
      this.playTone(220, 0.24, 'triangle', 0.11, 0, 85);
      this.playTone(660, 0.18, 'sine', 0.07, 0.03, 980);
    } else if (special === 'prism') {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((n, idx) => {
        this.playTone(n, 0.22, 'sine', 0.07, idx * 0.035);
      });
    }
  }

  public playFrostBreak() {
    this.playTone(960, 0.09, 'triangle', 0.06, 0, 1400);
  }

  public playBooster() {
    this.playTone(700, 0.14, 'sine', 0.08, 0, 1050);
    this.playTone(1050, 0.18, 'triangle', 0.06, 0.06, 1400);
  }

  public playVictory() {
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    chord.forEach((freq, i) => {
      this.playTone(freq, 0.38, 'sine', 0.08, i * 0.075);
    });
  }

  public playOutOfMoves() {
    const notes = [440, 392, 349.23, 293.66];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.22, 'triangle', 0.06, i * 0.09);
    });
  }

  public playRewardChime() {
    this.playTone(783.99, 0.18, 'sine', 0.08, 0);
    this.playTone(987.77, 0.22, 'sine', 0.08, 0.08);
    this.playTone(1174.66, 0.3, 'triangle', 0.07, 0.16);
  }
}

export const salonAudio = new SalonAudioEngine();
