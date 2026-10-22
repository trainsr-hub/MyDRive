// path: src/apps/dino-pomodoro/core/audioFx.ts
// Pure Web Audio API Synthesizer for Dino Pomodoro (zero external audio file dependencies)

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Subtle soft metallic tick for countdown
 */
export function playTick(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {
    // Graceful fallback if audio is not permitted
  }
}

/**
 * Ascending energetic sci-fi chime when incubation starts
 */
export function playTimerStart(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [329.63, 440, 554.37, 659.25]; // E4, A4, C#5, E5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.12, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  } catch {
    // Ignore
  }
}

/**
 * Soft descending chime when incubation pauses
 */
export function playTimerPause(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [554.37, 440, 329.63]; // C#5, A4, E4
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.09, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.25);
    });
  } catch {
    // Ignore
  }
}

/**
 * Triumphant celebratory fanfare & roar when a Dino finishes hatching
 */
export function playHatchFanfare(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Harmonized fanfare chords: C5, E5, G5 -> F5, A5, C6 -> G5, B5, D6 -> C6
    const chords = [
      { notes: [523.25, 659.25, 783.99], time: 0, duration: 0.2 },
      { notes: [587.33, 739.99, 880.00], time: 0.18, duration: 0.2 },
      { notes: [659.25, 830.61, 987.77], time: 0.36, duration: 0.25 },
      { notes: [783.99, 1046.50, 1318.51], time: 0.58, duration: 0.8 },
    ];

    chords.forEach(({ notes, time, duration }) => {
      notes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.14, now + time);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + duration);
      });
    });

    // Sub-bass thump for the egg breaking
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(150, now);
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

    subGain.gain.setValueAtTime(0.28, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 0.4);
  } catch {
    // Ignore
  }
}

/**
 * Generic reusable timer completion alarm sound.
 * Plays the standard digital alarm sound (/sounds/timer_alarm.wav) with Web Audio API fallback.
 */
export function playTimerAlarm(): void {
  // 1. Try HTML5 Audio for reliable background tab playback
  try {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/timer_alarm.wav');
      audio.volume = 0.85;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback to Web Audio synthesis if autoplay was blocked
          playSynthesizedTimerAlarm();
        });
        return;
      }
    }
  } catch {
    // Fallback
  }

  playSynthesizedTimerAlarm();
}

/**
 * Pure Web Audio API fallback for the generic timer alarm
 */
export function playSynthesizedTimerAlarm(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const beeps = [
      { time: 0.00, freq: 1046.5, dur: 0.08 },
      { time: 0.12, freq: 1046.5, dur: 0.08 },
      { time: 0.24, freq: 1046.5, dur: 0.08 },
      { time: 0.36, freq: 1318.5, dur: 0.16 },

      { time: 0.65, freq: 1046.5, dur: 0.08 },
      { time: 0.77, freq: 1046.5, dur: 0.08 },
      { time: 0.89, freq: 1046.5, dur: 0.08 },
      { time: 1.01, freq: 1318.5, dur: 0.22 },
    ];

    beeps.forEach(({ time, freq, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.3, now + time);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });
  } catch {
    // Ignore
  }
}

/**
 * Soft mark bell: rung when the countdown crosses a custom mark.
 * Inharmonic partials with a long decay give a bell timbre that is clearly
 * distinct from the final digital alarm. Pure Web Audio (no asset dependency).
 */
export function playMarkBell(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const base = 660;
    const partials = [
      { ratio: 1.0, gain: 0.26, decay: 2.4 },
      { ratio: 2.0, gain: 0.14, decay: 1.8 },
      { ratio: 2.76, gain: 0.1, decay: 1.4 },
      { ratio: 5.4, gain: 0.05, decay: 0.9 },
    ];

    partials.forEach(({ ratio, gain: peak, decay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(base * ratio, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay + 0.05);
    });
  } catch {
    // Ignore
  }
}

