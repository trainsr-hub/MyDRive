import React, { useState } from 'react';
import { EvoAvatar } from '../../../../molecule/EvoAvatar/EvoAvatar';
import { Sparkles, ChevronDown, ChevronUp, Search, X, Lock, Zap } from 'lucide-react';
import type { GachaOutcomesWorkerProps } from '../../types';
import './GachaOutcomesWorker.css';

const RARITY_COLORS: Record<string, string> = {
    common: '#a0aec0',
    rare: '#3b82f6',
    'super-rare': '#eab308',
    'super rare': '#eab308',
    legendary: '#a855f7',
    tournament: '#ec4899',
    vip: '#06b6d4',
    star: '#ffd700',
    'super-star': '#ffd700',
    toy: '#f97316',
    boss: '#ef4444'
};

const getImage = (lookup: any, category: string, key: string, fallback: string) => {
    return lookup?.[category]?.[key] ?? fallback;
};

/**
 * Worker: GachaOutcomesWorker
 * Responsibility: Renders searchable and collapsible pool outcomes panel
 * with specimen count tracking, dynamic drop rate probabilities, and Next Cap unlock milestones.
 */
export const GachaOutcomesWorker: React.FC<GachaOutcomesWorkerProps> = ({
    possibleOutcomes,
    lookup,
    cap,
    nextUnlock
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [search, setSearch] = useState('');
    const [previewDino, setPreviewDino] = useState<any | null>(null);

    const filtered = search.trim()
        ? possibleOutcomes.filter(d =>
            d.name.toLowerCase().includes(search.toLowerCase().trim()) ||
            (d.class || '').toLowerCase().includes(search.toLowerCase().trim()) ||
            (d.rarity || '').toLowerCase().includes(search.toLowerCase().trim())
        )
        : possibleOutcomes;

    return (
        <div className="w-full flex flex-col items-center gap-3">
            {/* Toggle Header Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition border cursor-pointer select-none ${
                    isOpen
                        ? 'bg-purple-900/30 border-purple-500 text-purple-300'
                        : 'bg-white/5 border-white/15 text-gray-400 hover:text-white'
                }`}
            >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Possible Outcomes ({possibleOutcomes.length})</span>
                {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Panel */}
            {isOpen && (
                <div className="dino-outcomes-panel dino-outcomes-panel-docked">
                    {/* Header */}
                    <div className="dino-outcomes-header">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#ffd700]" />
                            <div>
                                <div className="text-xs font-bold text-[#f5f0e8] uppercase tracking-wider">
                                    Possible Outcomes
                                </div>
                                <div className="text-[10px] text-[#9c93a8]">
                                    Dynamic weighted drop rates
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                Current Cap: {cap} Fero
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white p-1 cursor-pointer"
                                title="Close"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Next Cap Milestone Banner */}
                    {nextUnlock ? (
                        <div className="px-3 py-1.5 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-black/40 border-b border-amber-500/20 flex justify-between items-center text-[10.5px]">
                            <div className="flex items-center gap-1.5 text-amber-300">
                                <Lock className="w-3 h-3 text-amber-400" />
                                <span>Next Cap: <strong>{nextUnlock.name}</strong> (⚡{nextUnlock.requiredFerocity})</span>
                            </div>
                            <div className="text-cyan-400 font-mono font-bold text-[10px] bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                                +{nextUnlock.deltaNeeded} Fero to unlock
                            </div>
                        </div>
                    ) : (
                        <div className="px-3 py-1 bg-emerald-950/30 border-b border-emerald-500/20 text-center text-[10px] text-emerald-400 font-semibold">
                            ✨ All Cretaceous Specimens Gated Within Cap!
                        </div>
                    )}

                    {/* Summary Bar */}
                    <div className="px-3 py-1.5 bg-black/30 border-b border-white/5 flex justify-between items-center text-[11px] text-[#8c7a9e]">
                        <span>Pool: <strong className="text-[#ffd86b]">{possibleOutcomes.length}</strong> dinos</span>
                        <span>Active Cap: <strong className="text-amber-400">{cap} Fero</strong></span>
                    </div>

                    {/* Search */}
                    {possibleOutcomes.length > 3 && (
                        <div className="p-2 border-b border-white/5 relative">
                            <div className="relative flex items-center">
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search specimen..."
                                    className="w-full pl-8 pr-7 py-1 text-xs bg-black/40 border border-white/10 rounded-md text-[#f5f0e8] outline-none"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="absolute right-2 text-gray-400 hover:text-white cursor-pointer"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Scrollable list */}
                    <div className="dino-outcomes-scroll">
                        {filtered.length === 0 ? (
                            <div className="text-center py-6 text-xs text-[#8c7a9e]">
                                No dinosaurs found matching criteria.
                            </div>
                        ) : (
                            filtered.map((dino) => {
                                const frameUrl = getImage(lookup, 'portrait_frames', dino.rarity, `https://cdn.paleo.gg/games/jwtg/images/portrait-frame/${dino.rarity}.png`);
                                const classIconUrl = getImage(lookup, 'class_icons', dino.class || '', `https://cdn.paleo.gg/games/jwtg/images/class/${dino.class}.png`);
                                const rarityColor = RARITY_COLORS[(dino.rarity || '').toLowerCase()] || '#a0aec0';
                                const feroIcon = getImage(lookup, 'stats', 'ferocity', 'https://cdn.paleo.gg/games/jwtg/images/stats/ferocity.png');

                                return (
                                    <div
                                        key={dino.uuid}
                                        className={`dino-outcome-card ${dino.isOwned ? 'is-owned' : 'is-unowned'}`}
                                        onClick={() => setPreviewDino(previewDino?.uuid === dino.uuid ? null : dino)}
                                    >
                                        <div className="shrink-0">
                                            <EvoAvatar
                                                size={36}
                                                imageUrl={dino.maxEvoImg}
                                                frameUrl={frameUrl}
                                                isUnlocked={true}
                                                showLockOverlay={false}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-white truncate">
                                                    {dino.name}
                                                </span>
                                                {/* Clear Owned Specimen Count Badge */}
                                                <span className={`text-[9.5px] font-mono px-1 rounded font-bold ${
                                                    dino.isOwned
                                                        ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300'
                                                        : 'bg-white/5 border border-white/10 text-gray-400'
                                                }`}>
                                                    {dino.ownedCount}/{dino.maximumNumber}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-[10px] flex-wrap mt-0.5">
                                                {classIconUrl && (
                                                    <img src={classIconUrl} width="11" height="11" alt={dino.class} />
                                                )}
                                                <span style={{ color: rarityColor }} className="font-semibold capitalize">
                                                    {dino.rarity}
                                                </span>
                                                {dino.isOwned && (
                                                    <>
                                                        <span className="text-gray-500">•</span>
                                                        <span className="text-cyan-400 font-semibold">
                                                            Lv.{dino.currentRank * 10 || 10}
                                                        </span>
                                                    </>
                                                )}
                                                {dino.totalIngredientsCount > 0 && (
                                                    <span className="text-[9px] bg-purple-950/70 border border-purple-600/40 text-purple-300 px-1 rounded">
                                                        🧬 Ing: {dino.ownedIngredientsCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end shrink-0">
                                            <div className="flex items-center gap-1 text-[#ffd700] font-bold text-xs font-mono">
                                                {feroIcon ? (
                                                    <img src={feroIcon} width="11" height="11" alt="Fero" />
                                                ) : (
                                                    <Zap className="w-3 h-3 text-amber-400" />
                                                )}
                                                <span>{dino.ferocity}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-emerald-400 font-mono">
                                                {dino.dropRatePercent.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Quick Preview Tooltip */}
                    {previewDino && (
                        <div className="p-3 bg-[#140f1e]/95 border-t border-amber-500/25 flex items-center gap-2 text-xs">
                            <img src={previewDino.image_url} width="36" height="36" className="object-contain rounded bg-black/50 p-1" alt={previewDino.name} />
                            <div className="flex-1 text-[10px] space-y-0.5">
                                <div className="font-bold text-amber-400 flex items-center justify-between">
                                    <span>{previewDino.name} (Max Stats)</span>
                                    <span className="text-cyan-400 font-mono">Owned: {previewDino.ownedCount} / {previewDino.maximumNumber}</span>
                                </div>
                                <div className="text-gray-300 flex gap-3">
                                    <span>DMG: <strong className="text-red-400">{previewDino.maxDamage}</strong></span>
                                    <span>HP: <strong className="text-emerald-400">{previewDino.maxHealth}</strong></span>
                                    <span>Cost: <strong className="text-cyan-400">{previewDino.cost?.costLabel}</strong></span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewDino(null)}
                                className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300 text-[10px] cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
