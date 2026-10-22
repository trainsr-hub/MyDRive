import React, { useEffect, useRef } from 'react';
import { DinoCard } from '../../molecule/DinoCard/DinoCard';
import { EvoAvatar } from '../../molecule/EvoAvatar/EvoAvatar';
import { calcDinoCost } from '../../../core/calcDinoCost';

interface DinoDetailsTabProps {
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

    const getImage = (category: string, key: string, fallback: string) => {
        return lookup?.[category]?.[key] ?? fallback;
    };

    if (!dino) {
        return (
            <div className="w-full flex flex-col items-center justify-center p-12 bg-white/5 rounded-2xl border border-white/10 text-center gap-4">
                <div className="text-amber-400 font-cinzel text-lg">No Dino Selected</div>
                <p className="text-xs text-gray-400 max-w-sm">
                    Please select a dinosaur from the List of Dinos tab to view its detailed genetics and combat stats.
                </p>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                    >
                        Go to List of Dinos
                    </button>
                    {onGoToGacha && (
                        <button
                            type="button"
                            onClick={onGoToGacha}
                            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 font-bold text-xs cursor-pointer"
                        >
                            Go to Gacha
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const userDinoData = userProgress?.owned_dinos?.[uuid] || { number: 0, rank: 0 };
    const dinoRank = Number(userDinoData.rank) || 0;
    const dinoNumber = Number(userDinoData.number) || 0;
    const isLeftCardUnlocked = dinoNumber !== 0;

    const evolutions = dino.evolutions || [];
    const maxCapacity = Number(dino.maximum_number || Math.pow(2, Math.max(0, evolutions.length - 1)));

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

    const currentEvo = evolutions.length === 0 ? null : !isLeftCardUnlocked ? evolutions[evolutions.length - 1] : evolutions[Math.min(Math.max(dinoRank - 1, 0), evolutions.length - 1)];
    const currentDamage = currentEvo?.damage !== undefined ? currentEvo.damage.toLocaleString() : "N/A";
    const currentHealth = currentEvo?.health !== undefined ? currentEvo.health.toLocaleString() : "N/A";
    const currentFerocity = currentEvo?.damage !== undefined && currentEvo?.health !== undefined ? Math.floor(currentEvo.damage + currentEvo.health / 3.2) : "N/A";

    const damageIconUrl = getImage("stats", "damage", "https://cdn.paleo.gg/games/jwtg/images/stats/damage.png");
    const healthIconUrl = getImage("stats", "health", "https://cdn.paleo.gg/games/jwtg/images/stats/health.png");

    let progressWidth = 0;
    if (dinoNumber <= 0) progressWidth = 0;
    else if (dinoNumber <= 1) progressWidth = dinoNumber * 12.5;
    else if (dinoNumber <= 2) progressWidth = 12.5 + (dinoNumber - 1) * 25;
    else if (dinoNumber <= 4) progressWidth = 37.5 + ((dinoNumber - 2) / 2) * 25;
    else if (dinoNumber <= 8) progressWidth = 62.5 + ((dinoNumber - 4) / 4) * 25;
    else progressWidth = 100;

    useEffect(() => {
        if (!progressBarRef.current || evoNodeRefs.current.length === 0) return;

        const evoMilestones = [12.5, 37.5, 62.5, 87.5];
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
        <div className="w-full space-y-4">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-4 py-2 rounded-lg bg-gradient-to-b from-[#4a5568] to-[#2d3748] border-2 border-[#a0aec0] text-white font-mono text-xs font-black uppercase tracking-wider hover:opacity-90 transition cursor-pointer"
                    >
                        ◀ Danh Sách Dinos
                    </button>
                    {onGoToGacha && (
                        <button
                            type="button"
                            onClick={onGoToGacha}
                            className="px-4 py-2 rounded-lg bg-gradient-to-b from-[#291e07] to-[#120f18] border-2 border-[#ffd86b] text-[#ffd86b] font-mono text-xs font-black uppercase tracking-wider hover:bg-[#3d2c0b] transition cursor-pointer"
                        >
                            ▶ Đi Tới Gacha
                        </button>
                    )}
                </div>

                <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-cyan-400">
                    Capacity: <strong className="text-white">{dinoNumber} / {maxCapacity}</strong>
                </div>
            </div>

            {/* Classification Bar */}
            <div className="w-full bg-gradient-to-r from-white/5 to-black/30 border border-white/10 rounded-xl p-3 shadow-sm" style={{ borderTop: `3px solid ${themeColor}` }}>
                <div className="flex flex-wrap gap-3 justify-between items-center text-center">
                    {[
                        { label: 'Region', val: capitalize(dino.region), icon: regionUrl },
                        { label: 'Class', val: capitalize(dino.class), icon: classIconUrl },
                        { label: 'Type', val: capitalize(dino.hybrid_type), icon: hybridTypeUrl },
                        { label: 'Rarity', val: displayRarity, color: themeColor },
                        { label: 'Cost', val: cost.costLabel, bold: true, color: '#ffd86b' },
                        { label: 'Release', val: dino.release_date || "N/A", bold: true }
                    ].map((c, i) => (
                        <div key={i} className="flex-1 min-w-[60px] flex flex-col items-center">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{c.label}</span>
                            <span className="text-xs flex items-center gap-1.5 font-semibold" style={{ color: c.color || 'white' }}>
                                {c.icon && <img src={c.icon} width="14" height="14" className="object-contain" alt={c.label} />}
                                <span>{c.val}</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mid Section: DinoCard + Facts */}
            <div className="flex flex-wrap gap-6 items-start">
                <div className="shrink-0 flex justify-center">
                    <DinoCard
                        dinoName={dino.name || ""}
                        imageUrl={dino.image_url}
                        cardBgUrl={cardBgUrl}
                        classIconUrl={classIconUrl}
                        displayRarity={displayRarity}
                        isUnlocked={isLeftCardUnlocked}
                    />
                </div>

                <div className="flex-1 min-w-[280px] space-y-2">
                    <h4 className="font-cinzel text-sm font-bold text-amber-400 uppercase tracking-wider">
                        Specimen Archives & Lore
                    </h4>
                    {dino.facts?.map((fact: string, index: number) => {
                        const isUnlocked = index + 1 <= dinoRank;
                        const highestUnlocked = Math.min(dino.facts?.length || 0, dinoRank) - 1;
                        const isOpen = index === highestUnlocked && isUnlocked;
                        return (
                            <details
                                key={index}
                                open={isOpen}
                                className="bg-white/5 border border-white/10 rounded-lg overflow-hidden text-xs"
                            >
                                <summary className={`p-2.5 font-bold bg-white/5 select-none ${isUnlocked ? 'cursor-pointer text-white' : 'cursor-not-allowed text-gray-500'}`}>
                                    Fact {index + 1} {!isUnlocked && "🔒"}
                                </summary>
                                <div className="p-3 text-gray-300 leading-relaxed">{fact}</div>
                            </details>
                        );
                    })}
                </div>
            </div>

            {/* Evolutions & Stats Progress */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                <div className="relative py-3">
                    <div className="absolute top-10 left-0 h-1.5 w-full bg-white/10 rounded-full z-0" />
                    <div ref={progressBarRef} className="absolute top-10 left-0 h-1.5 w-0 bg-sky-500 rounded-full z-1 shadow-[0_0_8px_rgba(33,150,243,0.6)]" />

                    <div className="grid grid-cols-4 gap-2 justify-items-center relative z-10">
                        {evolutions.map((evo: any, index: number) => {
                            const isEvoUnlocked = index + 1 <= dinoRank;
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
                                        imageUrl={evo.image_url}
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
                <div className="grid grid-cols-3 text-center bg-black/40 py-2.5 px-4 rounded-lg font-mono font-bold text-sm">
                    <div className="flex items-center justify-center gap-1.5">
                        <img src={damageIconUrl} width="16" height="16" alt="DMG" />
                        <span className="text-red-400">{currentDamage}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                        <img src="https://cdn.paleo.gg/games/jwtg/images/stats/ferocity.png" width="16" height="16" alt="Fero" />
                        <span className="text-amber-400">{currentFerocity}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                        <img src={healthIconUrl} width="16" height="16" alt="HP" />
                        <span className="text-emerald-400">{currentHealth}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
