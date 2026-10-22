/**
 * Faust Acoustic Voice Engine
 * Connects the web client directly to Faust's Kokoro-82M neural TTS model
 * hosted on the local backend (POST http://127.0.0.1:8080/api/v1/voice/synthesize).
 *
 * Features:
 * - Direct zero-LLM neural phoneme-to-waveform audio stream
 * - In-memory LRU audio blob caching for 0ms replay and prefetched facts
 * - Background prefetching during ferocity climbing animations
 * - HTML5 Audio playback isolated from OS ducking (protects Vinyl Angel playback)
 */

export interface FaustVoiceCallbacks {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err?: any) => void;
}

let activeAudio: HTMLAudioElement | null = null;
let activeAudioUrl: string | null = null;
const audioBlobCache = new Map<string, string>();

const MALE_KEYWORDS = [
    'david', 'mark', 'george', 'guy', 'ryan', 'daniel', 'brian', 'tom',
    'oliver', 'james', 'richard', 'christopher', 'eric', 'steffan', 'paul',
    'male', 'stefan', 'cosmo', 'reed'
];

const FEMALE_KEYWORDS = [
    'zira',              // Microsoft Zira (Windows default clean female)
    'jenny',             // Microsoft Jenny (Natural female)
    'aria',              // Microsoft Aria (Natural female)
    'bella',             // Neural Kokoro / Natural
    'ava',               // Natural Ava
    'sonia',             // Natural Sonia
    'google us english', // Google Chrome US English female
    'samantha',          // Apple Samantha
    'victoria',          // Apple Victoria
    'karen',             // Apple Karen
    'female',
    'natural'
];

export const resolveFaustBrowserVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    if (!voices || voices.length === 0) return null;

    const isMale = (v: SpeechSynthesisVoice) => {
        const lower = v.name.toLowerCase();
        return MALE_KEYWORDS.some(k => lower.includes(k));
    };

    // 1. Prioritized female keywords with English locale
    for (const kw of FEMALE_KEYWORDS) {
        const match = voices.find(v =>
            v.lang.toLowerCase().startsWith('en') &&
            !isMale(v) &&
            v.name.toLowerCase().includes(kw)
        );
        if (match) return match;
    }

    // 2. Any English voice not matching male keywords
    const enNonMale = voices.find(v => v.lang.toLowerCase().startsWith('en') && !isMale(v));
    if (enNonMale) return enNonMale;

    // 3. Any non-male voice across all locales
    const anyNonMale = voices.find(v => !isMale(v));
    if (anyNonMale) return anyNonMale;

    return null;
};

/**
 * Prefetch Faust voice audio in the background for instant 0ms playback on modal trigger.
 */
export function prefetchFaustVoice(text: string): void {
    if (!text || !text.trim()) return;
    const trimmed = text.trim();
    if (audioBlobCache.has(trimmed)) return;

    fetchNeuralAudio(trimmed).catch(() => {
        // Silently swallow prefetch background errors
    });
}

/**
 * Stop any current voice playback (both HTML5 Audio and Web Speech).
 */
export const stopFaustVoice = (): void => {
    if (activeAudio) {
        try {
            activeAudio.pause();
            activeAudio.currentTime = 0;
        } catch {
            // ignore
        }
        activeAudio = null;
    }

    // Note: Do NOT revoke cached ObjectURLs so they can be replayed instantly without refetching
    if (activeAudioUrl && !Array.from(audioBlobCache.values()).includes(activeAudioUrl)) {
        try {
            URL.revokeObjectURL(activeAudioUrl);
        } catch {
            // ignore
        }
        activeAudioUrl = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
            window.speechSynthesis.cancel();
        } catch {
            // ignore
        }
    }
};

/**
 * Synthesizes speech using Faust's Kokoro neural backend endpoint.
 * Returns an HTMLAudioElement on success, or null on failure.
 */
async function fetchNeuralAudio(text: string): Promise<HTMLAudioElement | null> {
    const trimmed = text.trim();

    // Check cache first for instantaneous playback
    if (audioBlobCache.has(trimmed)) {
        const cachedBlobUrl = audioBlobCache.get(trimmed)!;
        const audio = new Audio(cachedBlobUrl);
        audio.preload = 'auto';
        return audio;
    }

    const endpoints = [
        'http://127.0.0.1:8080/api/v1/voice/synthesize',
        'http://localhost:8080/api/v1/voice/synthesize'
    ];

    const payload = {
        text: trimmed,
        voice: 'af_bella',
        secondary_voice: 'af_nicole',
        blend_voice: true,
        speed: 0.84,
        pitch_shift: -0.3,
        language: 'en-us',
        normalization_type: 'peak',
        enable_jitter: true
    };

    for (const url of endpoints) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'audio/wav, audio/*, */*'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (res.ok) {
                const blob = await res.blob();
                if (blob.size > 100) {
                    const blobUrl = URL.createObjectURL(blob);
                    audioBlobCache.set(trimmed, blobUrl);
                    const audio = new Audio(blobUrl);
                    audio.preload = 'auto';
                    return audio;
                }
            }
        } catch {
            // Try next endpoint
        }
    }

    return null;
}

/**
 * Plays speech using Faust's voice.
 * Primary: Kokoro Neural Voice via Backend.
 * Fallback: Browser Web Speech API strictly filtered for Faust's female profile.
 */
export async function playFaustVoice(
    text: string,
    callbacks?: FaustVoiceCallbacks
): Promise<void> {
    stopFaustVoice();

    if (!text || text.trim().length === 0) return;

    // 1. Try Neural Kokoro Backend
    try {
        const neuralAudio = await fetchNeuralAudio(text);
        if (neuralAudio) {
            activeAudio = neuralAudio;
            activeAudioUrl = neuralAudio.src;

            neuralAudio.onplay = () => {
                callbacks?.onStart?.();
            };

            neuralAudio.onended = () => {
                activeAudio = null;
                callbacks?.onEnd?.();
            };

            neuralAudio.onerror = (e) => {
                callbacks?.onError?.(e);
                fallbackBrowserSpeech(text, callbacks);
            };

            await neuralAudio.play();
            return;
        }
    } catch {
        // Fall through to browser speech synthesis
    }

    // 2. Fallback to Browser Speech Synthesis
    fallbackBrowserSpeech(text, callbacks);
}

function fallbackBrowserSpeech(text: string, callbacks?: FaustVoiceCallbacks): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        callbacks?.onError?.('Speech synthesis not supported');
        return;
    }

    try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.86;
        utterance.pitch = 1.05;

        const voices = window.speechSynthesis.getVoices();
        const faustVoice = resolveFaustBrowserVoice(voices);

        if (faustVoice) {
            utterance.voice = faustVoice;
        } else {
            // If no female voice is available yet, don't play male default to avoid wrong timbre
            if (voices.length > 0) {
                callbacks?.onEnd?.();
                return;
            }
        }

        utterance.onstart = () => callbacks?.onStart?.();
        utterance.onend = () => callbacks?.onEnd?.();
        utterance.onerror = (e) => {
            callbacks?.onError?.(e);
        };

        window.speechSynthesis.speak(utterance);
    } catch (err) {
        callbacks?.onError?.(err);
    }
}
