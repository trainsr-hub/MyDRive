import React, { useEffect, useRef } from 'react';
import { DinoCard } from '../../molecule/DinoCard/DinoCard';
import { EvoAvatar } from '../../molecule/EvoAvatar/EvoAvatar';
import { calcDinoCost } from '../../../core/calcDinoCost';
import { calcDinoMaxCapacity, calcDinoRank, calcDinoCurrentEvo, calcDinoProgressWidth, isDinoEvoUnlocked, getDinoAvatarUrl } from '../../../core/evolutionEngine';
import { X, Dna, BookOpen, Zap } from 'lucide-react';

export interface DinoDetailsTabProps {
    uuid: string;
    objects: any[];
    lookup: any;
    userProgress: any;
    onBack: () => void;
    onGoToGacha?: () => void;
}

export const DinoDetailsTab: React.FC<DinoDetailsTabProps> = ({
    uuid,
    objects,
    lookup,
    userProgress,
    onBack,
    onGoToGacha
}) => {
    const dino = objects.find(o => (o.uuid || o.id || o.name) === uuid);

    const progressBarRef = useRef<HTMLDivElement>(null);
    const evoNodeRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Dismiss on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onBack();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onBack]);

    const getImage = (category: string, key: string, fallback: string) => {
        return lookup?.[category]?.[key] ?? fallback;
    };

    if (!dino) {
        return (
            <div
                className="fixed inset-0 z-[100] flex justify-end bg-black/75 backdrop-blur-md animate-fadeIn select-none overflow-hidden cursor-pointer"
                onClick={onBack}
            >
                <div
                    className="relative w-full max-w-[580px] h-full bg-[#0d0a17]/95 border-l border-amber-500/40 shadow-[-12px_0_40px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center p-8 text-white animate-dinoSlideInRight cursor-default"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="text-amber-400 font-cinzel text-lg">No Dino Selected</div>
                    <p className="text-xs text-gray-400 max-w-sm text-center mt-2">
                        Please select a dinosaur from the List of Dinos to inspect its detailed genetics and combat metrics.
                    </p>
                    <button
                        type="button"
                        onClick={onBack}
                        className="mt-6 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                    >
                        Close Inspector
                    </button>
                </div>
            </div>
        );
    }

    const userDinoData = userProgress?.owned_dinos?.[uuid] || { number: 0, rank: 0 };
    const dinoNumber = Number(userDinoData.number) || 0;
    const evolutions = dino.evolutions || [];
    const dinoRank = calcDinoRank(dinoNumber, evolutions.length || 4);
    const isLeftCardUnlocked = dinoNumber !== 0;
    const maxCapacity = calcDinoMaxCapacity(dino);

    const cost = calcDinoCost(dino);

    const rawRarity = (dino.rarity || "").toLowerCase();
    const rarityMap: Record<string, string> = { tournament: "legendary", vip: "legendary", star: "legendary", toy: "legendary", "super-star": "legendary" };
    const displayRarity = (rarityMap[rawRarity] || rawRarity).toUpperCase();
    const rarityColors: Record<string, string> = { COMMON: "#b0c4de", RARE: "#4169e1", "SUPER RARE": "#ffd700", LEGENDARY: "#9370db" };
    const themeColor = rarityColors[displayRarity] || "#888";

    const regionUrl = getImage("region", dino.region, `https://cdn.paleo.gg/games/jwtg/images/region/${dino.region}.png`);
    const classIconUrl = getImage("class_icons", dino.class, `https://cdn.paleo.gg/games/jwtg/images/class/${dino.class}.png`);
    const hybridTypeUrl = getImage("hybrid_types", dino.hybrid_type, `https://cdn.paleo.gg/games/jwtg/images/hybrid-type/${dino.hybrid_type}.png`);

    const capitalize = (str: string) => str ? str.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "N/A";

    const currentEvo = calcDinoCurrentEvo(dino, dinoRank, isLeftCardUnlocked);
    const currentDamage = currentEvo?.damage !== undefined ? currentEvo.damage.toLocaleString() : "N/A";
    const currentHealth = currentEvo?.health !== undefined ? currentEvo.health.toLocaleString() : "N/A";
    const currentFerocity = currentEvo?.damage !== undefined && currentEvo?.health !== undefined ? Math.floor(currentEvo.damage + currentEvo.health / 3.2) : "N/A";

    const damageIconUrl = getImage("stats", "damage", "https://cdn.paleo.gg/games/jwtg/images/stats/damage.png");
    const healthIconUrl = getImage("stats", "health", "https://cdn.paleo.gg/games/jwtg/images/stats/health.png");
    const feroIconUrl = getImage("stats", "ferocity", "https://cdn.paleo.gg/games/jwtg/images/stats/ferocity.png");

    const progressWidth = calcDinoProgressWidth(dinoNumber, evolutions.length || 4);

    useEffect(() => {
        if (!progressBarRef.current || evoNodeRefs.current.length === 0) return;

        const evoMilestones = evolutions.map((_: any, i: number) => ((i + 0.5) / evolutions.length) * 100);
        const evoUnlockedScale = 1.10;
        const evoTemporaryScale = 1.12;
        const animationDuration = 1400;
        const animationStart = performance.now();
        let previousProgress = 0;
        let frameId: number;

        const triggerEvoAnimation = (node: HTMLDivElement | null, isUnlocked: boolean) => {
            if (!node || node.dataset.evoTriggered === "true") return;
            node.dataset.evoTriggered = "true";
            node.style.transform = `scale(${evoTemporaryScale})`;
            setTimeout(() => {
                if (node) node.style.transform = isUnlocked ? `scale(${evoUnlockedScale})` : "scale(1)";
            }, 280);
        };

        const animateProgress = (now: number) => {
            const elapsed = now - animationStart;
            const rawT = Math.min(elapsed / animationDuration, 1);
            const easedT = 1 - Math.pow(1 - rawT, 3);
            const currentProgress = progressWidth * easedT;

            if (progressBarRef.current) progressBarRef.current.style.width = `${currentProgress}%`;

            evoNodeRefs.current.forEach((node, i) => {
                const milestone = evoMilestones[i] !== undefined ? evoMilestones[i] : ((i + 0.5) / evoNodeRefs.current.length) * 100;
                if (previousProgress < milestone && currentProgress >= milestone) {
                    triggerEvoAnimation(node, node?.dataset.evoUnlocked === "true");
                }
            });

            previousProgress = currentProgress;

            if (rawT < 1) {
                frameId = requestAnimationFrame(animateProgress);
            } else {
                if (progressBarRef.current) progressBarRef.current.style.width = `${progressWidth}%`;
                evoNodeRefs.current.forEach((node, i) => {
                    const milestone = evoMilestones[i] !== undefined ? evoMilestones[i] : ((i + 0.5) / evoNodeRefs.current.length) * 100;
                    if (progressWidth >= milestone) triggerEvoAnimation(node, node?.dataset.evoUnlocked === "true");
                });
            }
        };

        frameId = requestAnimationFrame(animateProgress);
        return () => cancelAnimationFrame(frameId);
    }, [progressWidth, uuid]);

    const bgKey = `${dino.hybrid_type}_${dino.rarity}`;
    const cardBgUrl = getImage("card_backgrounds", bgKey, `https://cdn.paleo.gg/games/jwtg/images/card-bg/${dino.hybrid_type}/${dino.rarity}.png`);

    return (
        <div
            className="fixed inset-0 z-[100] flex justify-end bg-black/75 backdrop-blur-md animate-fadeIn select-none overflow-hidden cursor-pointer"
            onClick={onBack}
        >
            <div
                className="relative w-full max-w-[620px] h-full bg-[#0d0918]/95 border-l border-amber-500/40 shadow-[-14px_0_50px_rgba(0,0,0,0.9)] flex flex-col text-white animate-dinoSlideInRight overflow-hidden cursor-default select-text"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative Top Accent Glow Line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent z-10" />

                {/* Top Header Bar */}
                <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-black/60 border-b border-white/10 shrink-0 select-none">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {classIconUrl && (
                            <img
                                src={classIconUrl}
                                className="w-6 h-6 object-contain filter drop-shadow shrink-0"
                                alt={dino.class}
                            />
                        )}
                        <div className="flex flex-col min-w-0">
                            <h3 className="text-base sm:text-lg font-cinzel font-black tracking-wider text-white uppercase truncate drop-shadow">
                                {dino.name}
                            </h3>
                            <div className="flex items-center gap-2 text-[10.5px] font-mono text-gray-400 uppercase">
                                <span style={{ color: themeColor }} className="font-bold">{displayRarity}</span>
                                <span>•</span>
                                <span>{capitalize(dino.class)}</span>
                                <span>•</span>
                                <span className="text-cyan-400 font-bold">CAP: {dinoNumber}/{maxCapacity}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {onGoToGacha && (
                            <button
                                type="button"
                                onClick={onGoToGacha}
                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                                title="Go to Gacha to roll more specimens"
                            >
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                <span>Gacha</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onBack}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition cursor-pointer flex items-center justify-center"
                            title="Close Inspector (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    {/* Classification Bar */}
                    <div
                        className="w-full bg-gradient-to-r from-white/5 to-black/40 border border-white/10 rounded-xl p-3 shadow-sm select-none"
                        style={{ borderTop: `3px solid ${themeColor}` }}
                    >
                        <div className="flex flex-wrap gap-2 justify-between items-center text-center">
                            {[
                                { label: 'Region', val: capitalize(dino.region), icon: regionUrl },
                                { label: 'Class', val: capitalize(dino.class), icon: classIconUrl },
                                { label: 'Type', val: capitalize(dino.hybrid_type), icon: hybridTypeUrl },
                                { label: 'Rarity', val: displayRarity, color: themeColor },
                                { label: 'Cost', val: cost.costLabel, bold: true, color: '#ffd86b' },
                                { label: 'Release', val: dino.release_date || "N/A", bold: true }
                            ].map((c, i) => (
                                <div key={i} className="flex-1 min-w-[55px] flex flex-col items-center">
                                    <span className="text-[9.5px] text-gray-400 uppercase tracking-wider mb-0.5">{c.label}</span>
                                    <span className="text-xs flex items-center gap-1 font-semibold" style={{ color: c.color || 'white' }}>
                                        {c.icon && <img src={c.icon} width="13" height="13" className="object-contain" alt={c.label} />}
                                        <span>{c.val}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mid Section: DinoCard + Specimen Archives & Lore */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start justify-center">
                        <div className="shrink-0 flex justify-center shadow-[0_0_25px_rgba(0,0,0,0.7)] rounded overflow-hidden">
                            <DinoCard
                                dinoName={dino.name || ""}
                                imageUrl={dino.image_url}
                                cardBgUrl={cardBgUrl}
                                classIconUrl={classIconUrl}
                                displayRarity={displayRarity}
                                isUnlocked={isLeftCardUnlocked}
                            />
                        </div>

                        <div className="flex-1 w-full space-y-2.5">
                            <div className="flex items-center gap-1.5 pb-1 border-b border-amber-500/30">
                                <Dna className="w-4 h-4 text-amber-400" />
                                <h4 className="font-cinzel text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wider">
                                    Specimen Archives & Lore
                                </h4>
                            </div>

                            {dino.facts?.map((fact: string, index: number) => {
                                const isUnlocked = index + 1 <= dinoRank;
                                const highestUnlocked = Math.min(dino.facts?.length || 0, dinoRank) - 1;
                                const isOpen = index === highestUnlocked && isUnlocked;
                                return (
                                    <details
                                        key={index}
                                        open={isOpen}
                                        className="bg-white/5 border border-white/10 rounded-lg overflow-hidden text-xs transition-colors"
                                    >
                                        <summary className={`p-2.5 font-bold flex items-center justify-between select-none ${
                                            isUnlocked ? 'cursor-pointer text-amber-200 hover:bg-white/10' : 'cursor-not-allowed text-gray-500 bg-black/40'
                                        }`}>
                                            <span className="flex items-center gap-1.5">
                                                <BookOpen className="w-3.5 h-3.5" />
                                                <span>EVO {index + 1} FACT</span>
                                            </span>
                                            <span>{isUnlocked ? '🔓' : '🔒'}</span>
                                        </summary>
                                        <div className="p-3 text-gray-200 leading-relaxed bg-black/40 border-t border-white/5 font-sans">
                                            "{fact}"
                                        </div>
                                    </details>
                                );
                            })}
                        </div>
                    </div>

                    {/* Evolutions & Stats Progress */}
                    <div className="bg-black/50 p-4 rounded-xl border border-white/10 space-y-3 shadow-inner select-none">
                        <div className="flex items-center justify-between pb-1 border-b border-white/10">
                            <span className="text-[11px] font-mono font-bold text-gray-300 uppercase tracking-wider">
                                Evolutionary Milestone Tracker
                            </span>
                            <span className="text-[10px] font-mono text-amber-400 font-bold">
                                RANK {dinoRank} / {evolutions.length || 4}
                            </span>
                        </div>

                        <div className="relative py-3">
                            <div className="absolute top-10 left-0 h-1.5 w-full bg-white/10 rounded-full z-0" />
                            <div ref={progressBarRef} className="absolute top-10 left-0 h-1.5 w-0 bg-sky-500 rounded-full z-1 shadow-[0_0_8px_rgba(33,150,243,0.6)]" />

                            <div
                                className="gap-2 justify-items-center relative z-10 grid"
                                style={{ gridTemplateColumns: `repeat(${evolutions.length || 4}, minmax(0, 1fr))` }}
                            >
                                {evolutions.map((evo: any, index: number) => {
                                    const isEvoUnlocked = isDinoEvoUnlocked(dinoNumber, index, evolutions.length, true);
                                    const frameUrl = getImage("portrait_frames", dino.rarity, `https://cdn.paleo.gg/games/jwtg/images/portrait-frame/${dino.rarity}.png`);

                                    return (
                                        <div
                                            key={index}
                                            ref={el => { evoNodeRefs.current[index] = el; }}
                                            data-evo-unlocked={isEvoUnlocked ? "true" : "false"}
                                            data-evo-triggered="false"
                                            className="flex flex-col items-center bg-[#111] rounded-full p-1 transition-transform"
                                        >
                                            <EvoAvatar
                                                size={54}
                                                imageUrl={getDinoAvatarUrl(dino, index, true)}
                                                frameUrl={frameUrl}
                                                isUnlocked={isEvoUnlocked}
                                            />
                                            <div className="mt-1 text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-bold text-gray-300">
                                                LV{evo.level || (index + 1) * 10}
                                            </div>
                                            <div className="text-[9px] font-mono text-amber-400 mt-0.5">
                                                ⚡{evo.ferocity || Math.floor((evo.damage || 0) + (evo.health || 0) / 3.2)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Stat numbers */}
                        <div className="grid grid-cols-3 text-center bg-black/60 py-2.5 px-4 rounded-lg font-mono font-bold text-xs sm:text-sm border border-white/5">
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                    <img src={damageIconUrl} width="14" height="14" alt="DMG" />
                                    <span>DMG:</span>
                                </div>
                                <span className="text-red-400">{currentDamage}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                    <img src={feroIconUrl} width="14" height="14" alt="Fero" />
                                    <span>FERO:</span>
                                </div>
                                <span className="text-amber-400">{currentFerocity}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                    <img src={healthIconUrl} width="14" height="14" alt="HP" />
                                    <span>HP:</span>
                                </div>
                                <span className="text-emerald-400">{currentHealth}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
