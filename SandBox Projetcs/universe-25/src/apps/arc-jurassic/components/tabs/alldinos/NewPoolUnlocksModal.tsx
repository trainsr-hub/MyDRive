import React, { useEffect, useState } from 'react';
import { EvoAvatar } from '../../molecule/EvoAvatar/EvoAvatar';
import type { PoolDino } from '../gacha/types';
import { Sparkles, Zap, ArrowRight, Dna, CheckCircle2, Clock } from 'lucide-react';

export interface NewPoolUnlocksModalProps {
    isOpen: boolean;
    newlyUnlockedDinos: PoolDino[];
    prevCap?: number;
    newCap?: number;
    lookup: any;
    onClose: () => void;
    onGoToGacha?: () => void;
    autoContinueSeconds?: number;
}

const getImage = (lookup: any, category: string, key: string, fallback: string) => {
    return lookup?.[category]?.[key] ?? fallback;
};

const capitalize = (str: string) => str ? str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'N/A';

export const NewPoolUnlocksModal: React.FC<NewPoolUnlocksModalProps> = ({
    isOpen,
    newlyUnlockedDinos,
    prevCap,
    newCap,
    lookup,
    onClose,
    onGoToGacha,
    autoContinueSeconds
}) => {
    // 5-second or custom auto-continue countdown timer
    const [countdown, setCountdown] = useState<number | null>(null);

    useEffect(() => {
        if (!isOpen || autoContinueSeconds === undefined || autoContinueSeconds <= 0) {
            setCountdown(null);
            return;
        }

        setCountdown(autoContinueSeconds);
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    onClose();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, autoContinueSeconds, onClose]);

    // Dismiss on keyboard Enter, Space, or Escape
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !newlyUnlockedDinos || newlyUnlockedDinos.length === 0) return null;

    const rarityColors: Record<string, string> = {
        COMMON: '#b0c4de',
        RARE: '#4169e1',
        'SUPER RARE': '#ffd700',
        LEGENDARY: '#9370db',
        TOURNAMENT: '#f59e0b',
        VIP: '#e11d48',
        BOSS: '#ef4444'
    };

    const hasCapChange = prevCap !== undefined && newCap !== undefined && newCap > prevCap;
    const capDelta = hasCapChange ? newCap - prevCap : 0;

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn select-none overflow-y-auto cursor-pointer"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-3xl bg-[#0c0818]/95 border-2 border-cyan-500/50 rounded-2xl p-5 sm:p-6 shadow-[0_0_60px_rgba(6,182,212,0.35)] flex flex-col gap-4 text-white overflow-hidden animate-scaleUp my-auto max-h-[92vh] cursor-default"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative Top Accent Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)]" />

                {/* Header Title Section */}
                <div className="flex flex-col items-center text-center gap-1.5 shrink-0">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 font-mono text-xs font-black tracking-wider uppercase shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                        <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                        <span>GENETIC NEXUS EXPANSION</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-cinzel font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-300 tracking-wider drop-shadow">
                        New Specimens In Gacha Pool!
                    </h3>

                    {/* Cap Progression, Count Badge & Auto-Continue Timer */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-1 text-xs font-mono">
                        {hasCapChange && (
                            <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-lg border border-amber-500/40 text-amber-300 shadow-inner">
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                <span>Ferocity Cap:</span>
                                <span className="text-gray-400">⚡{prevCap.toLocaleString()}</span>
                                <ArrowRight className="w-3 h-3 text-amber-400" />
                                <span className="text-amber-300 font-bold">⚡{newCap.toLocaleString()}</span>
                                <span className="text-emerald-400 text-[11px] font-bold">(+{capDelta.toLocaleString()})</span>
                            </div>
                        )}

                        <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-lg border border-cyan-500/40 text-cyan-300 shadow-inner">
                            <Dna className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Available:</span>
                            <span className="font-bold text-white">
                                {newlyUnlockedDinos.length} New {newlyUnlockedDinos.length === 1 ? 'Creature' : 'Creatures'}
                            </span>
                        </div>

                        {countdown !== null && (
                            <div className="flex items-center gap-1.5 bg-cyan-950/80 px-3 py-1 rounded-lg border border-cyan-400/60 text-cyan-200 shadow-inner animate-pulse">
                                <Clock className="w-3.5 h-3.5 text-cyan-300" />
                                <span className="font-bold">Auto-continuing in {countdown}s</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scrollable Cards Grid */}
                <div className={`grid gap-3 overflow-y-auto max-h-[50vh] p-1 pr-1.5 ${
                    newlyUnlockedDinos.length === 1
                        ? 'grid-cols-1 max-w-md mx-auto w-full'
                        : newlyUnlockedDinos.length === 2
                        ? 'grid-cols-1 sm:grid-cols-2'
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                }`}>
                    {newlyUnlockedDinos.map((dino) => {
                        const rawRarity = (dino.rarity || '').toLowerCase();
                        const rarityMap: Record<string, string> = {
                            tournament: 'legendary',
                            vip: 'legendary',
                            star: 'legendary',
                            toy: 'legendary',
                            'super-star': 'legendary'
                        };
                        const displayRarity = (rarityMap[rawRarity] || rawRarity).toUpperCase();
                        const themeColor = rarityColors[displayRarity] || '#888';

                        const frameUrl = getImage(lookup, 'portrait_frames', dino.rarity, `https://cdn.paleo.gg/games/jwtg/images/portrait-frame/${dino.rarity}.png`);
                        const classIconUrl = dino.class ? getImage(lookup, 'class_icons', dino.class, `https://cdn.paleo.gg/games/jwtg/images/class/${dino.class}.png`) : '';

                        return (
                            <div
                                key={dino.uuid}
                                className="relative bg-gradient-to-b from-white/10 via-black/60 to-black/80 border border-white/15 rounded-xl p-3 shadow-lg flex items-center gap-3.5 group hover:border-cyan-400/60 transition-all"
                                style={{ borderTop: `3px solid ${themeColor}` }}
                            >
                                {/* Avatar */}
                                <div className="shrink-0 relative">
                                    <EvoAvatar
                                        size={58}
                                        imageUrl={dino.maxEvoImg || dino.evo1Img || dino.image_url || ''}
                                        frameUrl={frameUrl}
                                        isUnlocked={true}
                                    />
                                    {dino.class && classIconUrl && (
                                        <img
                                            src={classIconUrl}
                                            className="w-4 h-4 object-contain absolute -bottom-1 -right-1 drop-shadow"
                                            alt={dino.class}
                                            title={capitalize(dino.class)}
                                        />
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h4 className="font-cinzel font-bold text-sm text-white uppercase truncate drop-shadow">
                                        {dino.name}
                                    </h4>

                                    <div className="flex items-center gap-1.5 text-[10.5px] font-mono mt-0.5">
                                        <span style={{ color: themeColor }} className="font-bold">
                                            {displayRarity}
                                        </span>
                                        <span className="text-gray-500">•</span>
                                        <span className="text-gray-400">
                                            {capitalize(dino.class || '')}
                                        </span>
                                    </div>

                                    {/* Ferocity & Drop Rate */}
                                    <div className="flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-white/10 font-mono text-[11px]">
                                        <span className="text-amber-400 font-bold flex items-center gap-0.5">
                                            ⚡{dino.ferocity.toLocaleString()}
                                        </span>
                                        <span className="text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.2 rounded text-[10px]">
                                            {dino.dropRatePercent.toFixed(2)}% Drop
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10 shrink-0">
                    <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5 select-none">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Specimens ready in Gacha Summon Pool</span>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-mono text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            {countdown !== null && <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />}
                            <span>{countdown !== null ? `Dismiss (${countdown}s • Esc)` : 'Dismiss (Esc)'}</span>
                        </button>

                        {onGoToGacha && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onGoToGacha();
                                }}
                                className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                                <Zap className="w-4 h-4 text-amber-300" />
                                <span>Go To Gacha</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
