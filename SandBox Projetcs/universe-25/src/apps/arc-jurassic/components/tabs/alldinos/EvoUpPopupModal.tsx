import React, { useState, useEffect } from 'react';
import { DinoCard } from '../../molecule/DinoCard/DinoCard';
import { EvoAvatar } from '../../molecule/EvoAvatar/EvoAvatar';
import { Sparkles, ArrowRight, Zap, Dna, MousePointerClick, BookOpen, Clock } from 'lucide-react';

export interface EvoTierData {
    rank: number;
    level: number;
    damage: number;
    health: number;
    ferocity: number;
    image_url: string;
    isShadow?: boolean;
}

export interface EvoUpPopupModalProps {
    isOpen: boolean;
    dino: any;
    prevTier: EvoTierData;
    newTier: EvoTierData;
    lookup: any;
    onContinue: () => void;
    autoContinueSeconds?: number;
}

const getImage = (lookup: any, category: string, key: string, fallback: string) => {
    return lookup?.[category]?.[key] ?? fallback;
};

export const EvoUpPopupModal: React.FC<EvoUpPopupModalProps> = ({
    isOpen,
    dino,
    prevTier,
    newTier,
    lookup,
    onContinue,
    autoContinueSeconds
}) => {
    const [countdown, setCountdown] = useState<number>(autoContinueSeconds || 0);

    // Auto-continue countdown timer (active when autoContinueSeconds > 0)
    useEffect(() => {
        if (!isOpen || !autoContinueSeconds || autoContinueSeconds <= 0) {
            setCountdown(0);
            return;
        }

        setCountdown(autoContinueSeconds);
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onContinue();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, autoContinueSeconds, onContinue]);

    // Dismiss on keyboard Enter, Space, or Escape
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                e.preventDefault();
                onContinue();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onContinue]);

    if (!isOpen || !dino) return null;

    // Calculate Evolution Fact / Lore
    const factIndex = Math.max(0, newTier?.rank ? newTier.rank - 1 : 0);
    const evoFact = dino?.facts?.[factIndex] || dino?.facts?.[0] || 'Genetically augmented prehistoric titan awakened to a superior evolutionary tier.';

    const rarity = dino.rarity || 'common';
    const dinoClass = dino.class || 'carnivore';
    const hybridType = dino.hybrid_type || 'non-hybrid';
    const frameUrl = getImage(lookup, 'portrait_frames', rarity, `https://cdn.paleo.gg/games/jwtg/images/portrait-frame/${rarity}.png`);
    const classIconUrl = getImage(lookup, 'class_icons', dinoClass, `https://cdn.paleo.gg/games/jwtg/images/class/${dinoClass}.png`);
    const bgKey = `${hybridType}_${rarity}`;
    const cardBgUrl = getImage(lookup, 'card_backgrounds', bgKey, `https://cdn.paleo.gg/games/jwtg/images/card-bg/${hybridType}/${rarity}.png`);

    const rarityMap: Record<string, string> = {
        tournament: 'legendary',
        vip: 'legendary',
        star: 'legendary',
        toy: 'legendary',
        'super-star': 'legendary'
    };
    const displayRarity = (rarityMap[rarity.toLowerCase()] || rarity).toUpperCase();

    const damageIcon = getImage(lookup, 'stats', 'damage', 'https://cdn.paleo.gg/games/jwtg/images/stats/damage.png');
    const healthIcon = getImage(lookup, 'stats', 'health', 'https://cdn.paleo.gg/games/jwtg/images/stats/health.png');
    const feroIcon = getImage(lookup, 'stats', 'ferocity', 'https://cdn.paleo.gg/games/jwtg/images/stats/ferocity.png');

    const damageDiff = Math.max(0, newTier.damage - prevTier.damage);
    const healthDiff = Math.max(0, newTier.health - prevTier.health);
    const feroDiff = Math.max(0, newTier.ferocity - prevTier.ferocity);
    const rankDiff = Math.max(1, newTier.rank - prevTier.rank);

    const damagePct = prevTier.damage > 0 ? Math.round((damageDiff / prevTier.damage) * 100) : 100;
    const healthPct = prevTier.health > 0 ? Math.round((healthDiff / prevTier.health) * 100) : 100;
    const feroPct = prevTier.ferocity > 0 ? Math.round((feroDiff / prevTier.ferocity) * 100) : 100;

    const isPrevUnownedOrShadow = prevTier.isShadow || prevTier.rank === 0;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none overflow-y-auto cursor-pointer"
            onClick={onContinue}
        >
            <div
                className="relative w-full max-w-[840px] bg-[#120d1e]/95 border border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-[0_0_60px_rgba(255,215,0,0.35)] flex flex-col md:flex-row gap-5 text-white overflow-hidden animate-scaleUp my-auto max-h-[95vh] cursor-default"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative Top Accent Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

                {/* LEFT SIDE: Big Dino Showcase Card */}
                <div className="flex flex-col items-center justify-center shrink-0 self-center md:self-stretch">
                    <div className="relative group shadow-[0_0_25px_rgba(0,0,0,0.8)] rounded overflow-hidden">
                        <DinoCard
                            dinoName={dino.name || ''}
                            imageUrl={dino.image_url}
                            cardBgUrl={cardBgUrl}
                            classIconUrl={classIconUrl}
                            displayRarity={displayRarity}
                            isUnlocked={true}
                        />
                        {/* Dynamic Floating Tier Tag */}
                        <div className="absolute top-2 right-2 z-30 px-2 py-0.5 rounded bg-black/80 border border-amber-400/70 text-amber-300 font-mono text-[10.5px] font-black tracking-wider shadow-lg">
                            EVO {newTier.rank}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Evolution Visual Bridge + Emphasized Stats + Specimen Lore + Click-Anywhere CTA */}
                <div className="flex-1 flex flex-col justify-between gap-3 overflow-y-auto pr-0.5">
                    {/* Header */}
                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-0.5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono text-[11px] font-black tracking-wider uppercase shadow-[0_0_12px_rgba(255,215,0,0.35)]">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                            <span>EVOLUTION MILESTONE AWAKENED!</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <h3 className="text-lg sm:text-xl font-cinzel font-black tracking-wider text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                                {dino.name}
                            </h3>
                            {classIconUrl && (
                                <img
                                    src={classIconUrl}
                                    className="w-5 h-5 object-contain filter drop-shadow"
                                    alt={dinoClass}
                                    title={`Class: ${dinoClass}`}
                                />
                            )}
                        </div>
                        <div className="text-[11px] font-mono uppercase tracking-widest text-gray-400">
                            {rarity} • {dinoClass} • {hybridType}
                        </div>
                    </div>

                    {/* Evolution Visual Bridge with Bigger 80px Avatars */}
                    <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-black/60 border border-white/10 shadow-inner">
                        {/* Left Node: Previous Form */}
                        <div className="flex flex-col items-center gap-1.5 w-24 sm:w-28 shrink-0">
                            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">
                                {isPrevUnownedOrShadow ? 'PREVIOUS' : 'PREV EVO'}
                            </span>
                            <div className="w-[74px] h-[74px] sm:w-[80px] sm:h-[80px] rounded-lg overflow-hidden relative shadow-md border border-white/10">
                                <EvoAvatar
                                    size="100%"
                                    borderRadius="6px"
                                    imageUrl={isPrevUnownedOrShadow ? dino.image_url : prevTier.image_url}
                                    frameUrl={frameUrl}
                                    isUnlocked={!isPrevUnownedOrShadow}
                                    isShadow={isPrevUnownedOrShadow}
                                    showLockOverlay={false}
                                />
                            </div>
                            <span className="text-xs font-mono font-bold text-gray-300">
                                {isPrevUnownedOrShadow ? 'SHADOW' : `EVO ${prevTier.rank}`}
                            </span>
                        </div>

                        {/* Center Connector Conduit */}
                        <div className="flex flex-col items-center justify-center gap-1.5 flex-1 px-1">
                            <span className="text-[10.5px] font-mono font-black text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-400/60 shadow-md whitespace-nowrap">
                                +{rankDiff} EVO
                            </span>
                            <div className="flex items-center gap-1 w-full justify-center">
                                <div className="h-[2px] bg-gradient-to-r from-gray-600 via-amber-400 to-amber-500 flex-1" />
                                <ArrowRight className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
                            </div>
                            <span className="text-[10px] font-mono text-cyan-300 font-bold">
                                LV.{newTier.level}
                            </span>
                        </div>

                        {/* Right Node: Ascended Form */}
                        <div className="flex flex-col items-center gap-1.5 w-24 sm:w-28 shrink-0">
                            <span className="text-[10px] font-mono text-amber-400 font-black uppercase tracking-wider">
                                ASCENDED
                            </span>
                            <div className="w-[74px] h-[74px] sm:w-[80px] sm:h-[80px] rounded-lg overflow-hidden relative shadow-[0_0_20px_rgba(255,215,0,0.65)] border-2 border-amber-400">
                                <EvoAvatar
                                    size="100%"
                                    borderRadius="6px"
                                    imageUrl={newTier.image_url}
                                    frameUrl={frameUrl}
                                    isUnlocked={true}
                                    isShadow={false}
                                    showLockOverlay={false}
                                />
                            </div>
                            <span className="text-xs font-mono font-black text-amber-300">
                                EVO {newTier.rank}
                            </span>
                        </div>
                    </div>

                    {/* Emphasized Combat Stats Comparison Breakdown */}
                    <div className="bg-black/50 border border-white/10 rounded-xl p-2.5 sm:p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between pb-1 border-b border-white/10">
                            <span className="text-[11px] font-mono font-bold text-gray-300 tracking-wider">
                                COMBAT POWER METRICS
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                                LV.{newTier.level} CAP
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {/* Damage Stat Box */}
                            <div className="flex flex-col items-center bg-red-950/20 p-2 rounded-lg border border-red-500/25">
                                <div className="flex items-center gap-1 text-[10px] font-mono text-red-300 font-semibold">
                                    <img src={damageIcon} className="w-3.5 h-3.5 object-contain" alt="DMG" />
                                    <span>Damage</span>
                                </div>
                                <div className="text-[13px] sm:text-sm font-mono font-black text-white mt-1">
                                    {newTier.damage.toLocaleString()}
                                </div>
                                <div className="text-[10px] sm:text-[10.5px] font-mono font-black text-red-300 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-500/40 mt-1 shadow-sm whitespace-nowrap">
                                    +{damageDiff.toLocaleString()} <span className="text-[9px] text-red-200/90 font-bold">(+{damagePct}%)</span>
                                </div>
                            </div>

                            {/* Health Stat Box */}
                            <div className="flex flex-col items-center bg-sky-950/20 p-2 rounded-lg border border-sky-500/25">
                                <div className="flex items-center gap-1 text-[10px] font-mono text-sky-300 font-semibold">
                                    <img src={healthIcon} className="w-3.5 h-3.5 object-contain" alt="HP" />
                                    <span>Health</span>
                                </div>
                                <div className="text-[13px] sm:text-sm font-mono font-black text-white mt-1">
                                    {newTier.health.toLocaleString()}
                                </div>
                                <div className="text-[10px] sm:text-[10.5px] font-mono font-black text-sky-300 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-500/40 mt-1 shadow-sm whitespace-nowrap">
                                    +{healthDiff.toLocaleString()} <span className="text-[9px] text-sky-200/90 font-bold">(+{healthPct}%)</span>
                                </div>
                            </div>

                            {/* Ferocity Stat Box */}
                            <div className="flex flex-col items-center bg-amber-950/30 p-2 rounded-lg border border-amber-500/35">
                                <div className="flex items-center gap-1 text-[10px] font-mono text-amber-300 font-bold">
                                    <img src={feroIcon} className="w-3.5 h-3.5 object-contain" alt="Fero" />
                                    <span>Ferocity</span>
                                </div>
                                <div className="text-[13px] sm:text-sm font-mono font-black text-amber-300 mt-1">
                                    {newTier.ferocity.toLocaleString()}
                                </div>
                                <div className="text-[10px] sm:text-[10.5px] font-mono font-black text-amber-200 bg-amber-500/30 px-2 py-0.5 rounded border border-amber-400/60 mt-1 shadow-[0_0_8px_rgba(255,215,0,0.4)] whitespace-nowrap">
                                    +{feroDiff.toLocaleString()} <span className="text-[9px] text-amber-100 font-bold">(+{feroPct}%)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Specimen Lore & Genetic Archive - High Readability Layout */}
                    <div className="bg-gradient-to-br from-amber-950/30 via-black/60 to-purple-950/20 border border-amber-500/40 rounded-xl p-3 sm:p-3.5 flex flex-col gap-2 relative shadow-md">
                        <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/25">
                            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                                <Dna className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>GENETIC ARCHIVE • SPECIMEN LORE</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <BookOpen className="w-3 h-3 text-amber-400" />
                                <span>EVO {newTier.rank} FACT</span>
                            </div>
                        </div>
                        <div className="border-l-4 border-amber-400/80 pl-3 py-1 bg-amber-500/[0.04] rounded-r-lg">
                            <p className="text-[13px] sm:text-sm md:text-[14px] text-amber-50 font-sans leading-relaxed tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] select-text">
                                "{evoFact}"
                            </p>
                        </div>
                    </div>

                    {/* Action Prompt & User-Controlled Dismissal CTA */}
                    <button
                        type="button"
                        onClick={onContinue}
                        className="w-full py-2.5 px-4 rounded-xl font-cinzel font-black text-xs sm:text-[13px] uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-200 transition-all shadow-[0_0_25px_rgba(255,215,0,0.5)] cursor-pointer flex items-center justify-center gap-2 select-none active:scale-[0.98] mt-1 shrink-0 group"
                    >
                        {autoContinueSeconds && countdown > 0 ? (
                            <>
                                <Clock className="w-4 h-4 text-black animate-spin" />
                                <span>Auto-continuing in {countdown}s • (Or Click Anywhere)</span>
                                <Zap className="w-3.5 h-3.5 text-black fill-black" />
                            </>
                        ) : (
                            <>
                                <MousePointerClick className="w-4 h-4 text-black fill-black/20 group-hover:scale-110 transition-transform" />
                                <span>Click Anywhere to Continue</span>
                                <Zap className="w-3.5 h-3.5 text-black fill-black" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
