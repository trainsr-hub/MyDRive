import React from 'react';
import { DinoCard } from '../../../../molecule/DinoCard/DinoCard';
import { EvoAvatar } from '../../../../molecule/EvoAvatar/EvoAvatar';
import { rutGonTime } from '../../../../../core/rutGonTime';
import { calcDinoCost } from '../../../../../core/calcDinoCost';
import { X, ArrowLeft } from 'lucide-react';
import type { GachaResultWorkerProps } from '../../types';
import './GachaResultWorker.css';

const getImage = (lookup: any, category: string, key: string, fallback: string) => {
    return lookup?.[category]?.[key] ?? fallback;
};

/**
 * Worker: GachaResultWorker
 * Responsibility: Displays the hatched dino specimen, the focused evolution bridge
 * showing [Highest Owned Evo] ➔ [Projected Achieved Evo], with pure intermediate
 * mini avatars embedded seamlessly in the conduit without text noise or extra sections.
 *
 * Flow Control:
 * - "Back to Gacha" (or Close 'X') dismisses the result window back to the Init Gacha UI.
 * - The unbought dino remains saved as "Due" in the background.
 * - "Skip Specimen" is accessible exclusively when God Mode (Free Buy Cheat) is active.
 */
export const GachaResultWorker: React.FC<GachaResultWorkerProps> = ({
    resultUuid,
    objects,
    lookup,
    userProgress,
    rolledMultiplier = 1,
    isBuying,
    isSkipping,
    isFreeBuyCheat = false,
    onBuy,
    onCloseToInit,
    onGodModeSkip
}) => {
    const dino = objects.find(o => (o.uuid || o.id || o.name) === resultUuid);
    if (!dino) return <div className="text-red-400 text-center py-8">Dino specimen data not found</div>;

    const userDinoData = userProgress.owned_dinos?.[resultUuid] || { number: 0, rank: 0 };
    const currentRank = Number(userDinoData.rank) || 0;
    const currentNumber = Number(userDinoData.number) || 0;

    const evolutions = dino.evolutions || [];
    const maxCapacity = Number(dino.maximum_number || Math.pow(2, Math.max(0, evolutions.length - 1)));
    const remainingToCap = Math.max(1, maxCapacity - currentNumber);

    // Clamped buy quantity: cannot exceed evolution requirement
    const effectiveQuantity = Math.min(rolledMultiplier, remainingToCap);
    const isClamped = rolledMultiplier > effectiveQuantity;

    // Projected evolution rank achieved from this purchase
    const projectedCount = currentNumber + effectiveQuantity;
    const projectedRank = 1 + Math.floor(Math.log2(projectedCount));

    // Highest Owned Evo index (0 if unowned) vs Achieved Target index
    const highestOwnedIndex = Math.max(0, currentRank - 1);
    const achievedTargetIndex = Math.min(Math.max(0, projectedRank - 1), Math.max(0, evolutions.length - 1));

    const highestOwnedEvo = currentRank > 0 ? evolutions[highestOwnedIndex] : null;
    const achievedTargetEvo = evolutions[achievedTargetIndex];

    // Compute intermediate skipped evolution tiers
    const startEvoRank = currentRank > 0 ? currentRank : 0;
    const intermediateEvos: Array<{ rank: number; level: number; evo: any }> = [];
    for (let r = startEvoRank + 1; r < projectedRank; r++) {
        const evoObj = evolutions[r - 1];
        if (evoObj) {
            intermediateEvos.push({
                rank: r,
                level: evoObj.level || r * 10,
                evo: evoObj,
            });
        }
    }

    const frameUrl = getImage(lookup, 'portrait_frames', dino.rarity, `https://cdn.paleo.gg/games/jwtg/images/portrait-frame/${dino.rarity}.png`);
    const classIconUrl = getImage(lookup, 'class_icons', dino.class || '', `https://cdn.paleo.gg/games/jwtg/images/class/${dino.class}.png`);
    const bgKey = `${dino.hybrid_type}_${dino.rarity}`;
    const cardBgUrl = getImage(lookup, 'card_backgrounds', bgKey, `https://cdn.paleo.gg/games/jwtg/images/card-bg/${dino.hybrid_type}/${dino.rarity}.png`);

    let baseDamage = 0;
    let baseHealth = 0;
    if (currentRank > 0 && evolutions.length > 0) {
        const baseEvo = evolutions.find((e: any) => e.level === currentRank * 10) || evolutions[highestOwnedIndex];
        if (baseEvo) {
            baseDamage = baseEvo.damage || 0;
            baseHealth = baseEvo.health || 0;
        }
    }
    const baseFerocity = Math.floor(baseDamage + (baseHealth / 3.2));

    const targetDamage = achievedTargetEvo?.damage || 0;
    const targetHealth = achievedTargetEvo?.health || 0;
    const targetFerocity = Math.floor(targetDamage + (targetHealth / 3.2));

    // Dynamic formula cost scaled by effective quantity
    const unitCost = calcDinoCost(dino);
    const totalTimeSeconds = unitCost.timeSeconds * effectiveQuantity;
    const totalTimeMinutes = Number((unitCost.timeMinutes * effectiveQuantity).toFixed(2));
    const totalDnaCost = unitCost.dnaCost * effectiveQuantity;
    const totalRedOrbCost = unitCost.redOrbCost * effectiveQuantity;

    const hatchTimeFormatted = rutGonTime(totalTimeSeconds, "seconds");

    const timeIconUrl = getImage(lookup, 'hybrid_types', 'speed', 'https://cdn.paleo.gg/games/jwtg/images/stats/speed.png');
    const dnaIconUrl = 'https://cdn.paleo.gg/games/jwtg/images/resource/dna.png';
    const orbIconUrl = getImage(lookup, 'hybrid_types', 'super-hybrid', '');

    const rarityMap: Record<string, string> = {
        tournament: "legendary",
        vip: "legendary",
        star: "legendary",
        toy: "legendary",
        "super-star": "legendary"
    };
    const displayRarity = (rarityMap[dino.rarity?.toLowerCase()] || dino.rarity || "").toUpperCase();

    const damageIcon = getImage(lookup, 'stats', 'damage', 'https://cdn.paleo.gg/games/jwtg/images/stats/damage.png');
    const healthIcon = getImage(lookup, 'stats', 'health', 'https://cdn.paleo.gg/games/jwtg/images/stats/health.png');
    const feroIcon = getImage(lookup, 'stats', 'ferocity', 'https://cdn.paleo.gg/games/jwtg/images/stats/ferocity.png');

    return (
        <div className="dino-gacha-result relative">
            {/* Top Close / Back to Gacha Dismiss Button */}
            <button
                type="button"
                onClick={onCloseToInit}
                className="absolute -top-3 right-0 md:-right-2 z-50 p-2 rounded-xl bg-black/60 hover:bg-white/10 text-gray-400 hover:text-white border border-white/15 transition cursor-pointer flex items-center gap-1.5 text-xs font-mono select-none shadow-md"
                title="Return to Gacha View (Dino stays due until purchased)"
            >
                <ArrowLeft className="w-3.5 h-3.5 text-[#ffd86b]" />
                <span>Return to Gacha</span>
                <X className="w-3.5 h-3.5 text-gray-400 ml-1" />
            </button>

            {/* Left Card */}
            <div className="dino-gacha-left-card">
                <DinoCard
                    dinoName={dino.name || ""}
                    imageUrl={dino.image_url}
                    cardBgUrl={cardBgUrl}
                    classIconUrl={classIconUrl}
                    displayRarity={displayRarity}
                    isUnlocked={true}
                />
            </div>

            {/* Right Panel */}
            <div className="dino-gacha-right-panel">
                {/* Evolution Bridge Container: Two Main Nodes + Pure Connector Minis */}
                <div className="dino-evo-bridge">
                    {/* Left Node: Highest Owned */}
                    <div className="dino-evo-node">
                        <span className="dino-evo-node-title">Highest Owned</span>
                        <div className="dino-evo-avatar-box is-owned-node">
                            <EvoAvatar
                                size={68}
                                imageUrl={highestOwnedEvo?.image_url || null}
                                frameUrl={frameUrl}
                                isUnlocked={currentRank > 0}
                                fallbackType={currentRank > 0 ? null : 'black'}
                            />
                        </div>
                        <span className="dino-evo-node-rank owned-rank">
                            {currentRank > 0 ? `EVO ${currentRank}` : 'UNOWNED'}
                        </span>
                    </div>

                    {/* Center Connector Conduit (Arrow + Pure Mini Avatars with No Text) */}
                    <div className="dino-evo-connector">
                        <span className="dino-evo-connector-badge">
                            {projectedRank > currentRank ? `+${projectedRank - currentRank} EVO` : 'SAME'}
                        </span>

                        <div className="dino-evo-connector-arrow">
                            <div className="dino-evo-connector-line" />
                            <span className="dino-evo-arrow-head">▶</span>
                        </div>

                        {/* Pure Mini Avatars (No Text, No Extra Section) */}
                        {intermediateEvos.length > 0 && (
                            <div className="dino-evo-mini-row">
                                {intermediateEvos.map((item) => (
                                    <div
                                        key={item.rank}
                                        className="dino-evo-mini-box"
                                        title={`EVO ${item.rank} (LV.${item.level})`}
                                    >
                                        <EvoAvatar
                                            size={28}
                                            imageUrl={item.evo.image_url}
                                            frameUrl={frameUrl}
                                            isUnlocked={true}
                                            showLockOverlay={false}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Node: Achieved Rank */}
                    <div className="dino-evo-node">
                        <span className="dino-evo-node-title">Achieved Rank</span>
                        <div className="dino-evo-avatar-box is-target-node">
                            <EvoAvatar
                                size={68}
                                imageUrl={achievedTargetEvo?.image_url || dino.image_url}
                                frameUrl={frameUrl}
                                isUnlocked={true}
                            />
                        </div>
                        <span className="dino-evo-node-rank target-rank">
                            EVO {projectedRank}
                        </span>
                    </div>
                </div>

                {/* Pre-Roll Gamble Resolution Banner */}
                <div className="dino-gamble-resolution">
                    <div className="dino-gamble-title">
                        🎲 Gacha Gamble: {effectiveQuantity}x Specimen Drop
                    </div>
                    <div className="dino-gamble-sub">
                        <span>Current Owned: <strong>{currentNumber}</strong> / {maxCapacity}</span>
                        {isClamped && (
                            <span className="text-amber-400 block font-semibold text-[9.5px]">
                                * Wager x{rolledMultiplier} clamped to x{effectiveQuantity} (Evolution Cap)
                            </span>
                        )}
                    </div>
                </div>

                {/* Stats Card */}
                <div className="dino-gacha-stats-card">
                    <div className="dino-gacha-stats-title flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-white tracking-wider">PROJECTED STATS</span>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-cyan-400 font-mono">
                            LV.{projectedRank * 10 || 10}
                        </span>
                    </div>
                    <div className="dino-gacha-stats">
                        <div className="dino-gacha-stat">
                            <img className="dino-gacha-stat-icon" src={damageIcon} alt="DMG" />
                            <div className="dino-gacha-stat-label text-gray-400">Damage</div>
                            <div className="flex items-center text-xs font-bold text-white mt-0.5">
                                <span>{baseDamage}</span>
                                <span className="dino-stat-flicker">+{Math.max(0, targetDamage - baseDamage)}</span>
                            </div>
                        </div>
                        <div className="dino-gacha-stat">
                            <img className="dino-gacha-stat-icon" src={healthIcon} alt="HP" />
                            <div className="dino-gacha-stat-label text-gray-400">Health</div>
                            <div className="flex items-center text-xs font-bold text-white mt-0.5">
                                <span>{baseHealth}</span>
                                <span className="dino-stat-flicker">+{Math.max(0, targetHealth - baseHealth)}</span>
                            </div>
                        </div>
                        <div className="dino-gacha-stat">
                            <img className="dino-gacha-stat-icon" src={feroIcon} alt="Fero" />
                            <div className="dino-gacha-stat-label text-gray-400">Ferocity</div>
                            <div className="flex items-center text-xs font-bold text-white mt-0.5">
                                <span>{baseFerocity}</span>
                                <span className="dino-stat-flicker">+{Math.max(0, targetFerocity - baseFerocity)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Costs Breakdown (Jurassic Time + DNA or Red Orbs) */}
                <div className="dino-gacha-costs">
                    <div className="dino-gacha-cost">
                        <div className="dino-gacha-cost-label text-gray-400">Jurassic Time ({effectiveQuantity}x)</div>
                        <div className="dino-gacha-cost-value text-white">
                            {isFreeBuyCheat ? <span className="text-emerald-400">0s (FREE)</span> : `${hatchTimeFormatted} (${totalTimeMinutes}m)`}
                        </div>
                    </div>
                    <div className="dino-gacha-cost">
                        <div className="dino-gacha-cost-label text-gray-400">
                            {unitCost.isSpecial ? `Red Orbs (${effectiveQuantity}x)` : `DNA Cost (${effectiveQuantity}x)`}
                        </div>
                        <div className="dino-gacha-cost-value text-amber-400">
                            {isFreeBuyCheat ? (
                                <span className="text-emerald-400">0 (FREE)</span>
                            ) : (
                                unitCost.isSpecial ? `${totalRedOrbCost} Orbs` : `${totalDnaCost.toLocaleString()} DNA`
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons: Buy, Return to Gacha, and God Mode Skip */}
                <div className="flex flex-col gap-2 w-full items-center">
                    <button
                        type="button"
                        className="dino-buy-button"
                        onClick={() => onBuy(effectiveQuantity)}
                        disabled={isBuying}
                    >
                        <div className="font-bold text-sm">
                            {isBuying
                                ? 'Purchasing...'
                                : isFreeBuyCheat
                                ? `Claim ${effectiveQuantity}x Dinosaur (FREE CHEAT)`
                                : `Buy ${effectiveQuantity}x Dinosaur`}
                        </div>
                        <div className="text-[11px] font-normal mt-0.5 flex items-center justify-center gap-3 opacity-90">
                            {isFreeBuyCheat ? (
                                <span className="text-emerald-300 font-bold">
                                    🔓 God Mode: 0 Time • 0 DNA • 0 Orbs
                                </span>
                            ) : (
                                <>
                                    <span className="flex items-center gap-1">
                                        <img src={timeIconUrl} className="w-3.5 h-3.5 object-contain" alt="Jurassic Time" />
                                        {totalTimeMinutes}m Time
                                    </span>
                                    {unitCost.isSpecial ? (
                                        <span className="flex items-center gap-1">
                                            <img src={orbIconUrl} className="w-3.5 h-3.5 object-contain" alt="Red Orb" />
                                            {totalRedOrbCost} Red Orbs
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <img src={dnaIconUrl} className="w-3.5 h-3.5 object-contain" alt="DNA" />
                                            {totalDnaCost.toLocaleString()} DNA
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </button>

                    {/* Secondary Action: Return to Init View or God Mode Skip */}
                    {isFreeBuyCheat ? (
                        <button
                            type="button"
                            className="dino-pass-button text-amber-300 border-amber-500/40 hover:bg-amber-500/10"
                            onClick={onGodModeSkip}
                            disabled={isSkipping}
                            title="Purge pending due specimen from memory"
                        >
                            {isSkipping ? 'Processing...' : '⚡ Skip Due Specimen (God Mode Purge)'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="dino-pass-button"
                            onClick={onCloseToInit}
                            title="Return to Gacha View (This dinosaur remains due until purchased)"
                        >
                            ↩ Return to Gacha (Dino Remains Due)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
