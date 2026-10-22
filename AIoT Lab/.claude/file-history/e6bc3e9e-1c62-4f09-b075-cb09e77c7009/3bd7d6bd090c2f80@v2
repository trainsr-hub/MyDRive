// path: src/apps/heraclitus/services/chronoAudio.ts
// Tier 2: Sound engine helper for Two-Phase Kinetic Accumulator
// Zero external dependencies, pure Web Audio API

class ChronoAudioEngine {
  private ctx: AudioContext | null = null

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  playTick(freq = 420): void {
    const ctx = this.initCtx()
    if (!ctx) return
    try {
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.04, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.03)
    } catch {}
  }

  playShatter(): void {
    const ctx = this.initCtx()
    if (!ctx) return
    try {
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(170, t)
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.45)
      gain.gain.setValueAtTime(0.45, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.45)
    } catch {}
  }

  playAbsorb(freq = 880): void {
    const ctx = this.initCtx()
    if (!ctx) return
    try {
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.04, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.06)
    } catch {}
  }
}

export const chronoAudio = new ChronoAudioEngine()
