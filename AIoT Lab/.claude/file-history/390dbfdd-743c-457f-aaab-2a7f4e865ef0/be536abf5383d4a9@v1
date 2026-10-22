import React, { useState } from 'react';
import { GachaOutcomesWorker } from '../GachaOutcomesWorker/GachaOutcomesWorker';
import { GachaTopDinosWorker } from '../GachaTopDinosWorker/GachaTopDinosWorker';
import { ChevronDown } from 'lucide-react';
import type { GachaInitWorkerProps } from '../../types';
import './GachaInitWorker.css';

/**
 * Worker: GachaInitWorker
 * Responsibility: Renders the idle Gacha Nexus view:
 * - Left Side: Apex Vanguard (User's Top 3 Dinos) via GachaTopDinosWorker
 * - Center: Idle Black Hole Accretion Stage + Summon Button + Roll Wager Dropdown (below button)
 * - Right Side: Possible Outcomes Pool via GachaOutcomesWorker
 */
export const GachaInitWorker: React.FC<GachaInitWorkerProps> = ({
    possibleOutcomes,
    top3Dinos,
    top3Ferocity,
    lookup,
    cap,
    nextUnlock,
    dueDino,
    onStartSummon
}) => {
    // Multiplier state selected before rolling (Gamble Factor)
    const [multiplier, setMultiplier] = useState<number>(1);

    const multiplierOptions = [1, 2, 3, 4, 8, 16];
    const feroIcon = lookup?.stats?.ferocity || 'https://cdn.paleo.gg/games/jwtg/images/stats/ferocity.png';

    return (
        <div className="gacha-init-worker-container">
            {/* Left Side: Apex Vanguard (Top 3 Dinos) Sub-Worker */}
            <GachaTopDinosWorker
                top3Dinos={top3Dinos}
                top3Ferocity={top3Ferocity}
                cap={cap}
                lookup={lookup}
            />

            {/* Right Side: Outcomes Panel Sub-Worker */}
            <GachaOutcomesWorker
                possibleOutcomes={possibleOutcomes}
                lookup={lookup}
                cap={cap}
                nextUnlock={nextUnlock}
            />

            {/* Center: Idle Black Hole Stage */}
            <div className="bh-idle-stage">
                <div className="bh-idle-hole">
                    <div className="bh-ring bh-ring-1" />
                    <div className="bh-ring bh-ring-2" />
                    <div className="bh-ring bh-ring-3" />
                    <div className="bh-ring bh-ring-4" />
                    <div className="bh-core" />
                </div>
            </div>

            {/* Center: Summon Dinosaur Button (Primary Action) */}
            <button
                type="button"
                className="dino-summon-button"
                onClick={() => onStartSummon(multiplier)}
                disabled={!dueDino && possibleOutcomes.length === 0}
            >
                {dueDino ? (
                    <span className="flex items-center justify-center gap-2">
                        <img src={feroIcon} className="w-4 h-4 object-contain" alt="Due" />
                        <span>View Pending Due Specimen (Must Purchase)</span>
                    </span>
                ) : possibleOutcomes.length === 0 ? (
                    'No Dino in Ferocity Pool'
                ) : multiplier > 1 ? (
                    `Summon ${multiplier}x Dinosaurs (Gacha Gamble)`
                ) : (
                    'Summon Dinosaur (Gacha)'
                )}
            </button>

            {/* Center: Pre-Roll Multiplier Gamble Dropdown Selector (Placed BELOW Gacha Button) */}
            <div className="gacha-multiplier-bar">
                <span className="gacha-multiplier-label">Roll Wager:</span>
                <div className="gacha-multiplier-select-wrapper">
                    <select
                        value={multiplier}
                        onChange={(e) => setMultiplier(Number(e.target.value))}
                        className="gacha-multiplier-select"
                        disabled={Boolean(dueDino)}
                    >
                        {multiplierOptions.map(m => (
                            <option key={m} value={m} className="bg-[#120f18] text-[#f5f0e8]">
                                {m}x Specimen Wager (x{m})
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="gacha-select-chevron" />
                </div>
            </div>
        </div>
    );
};
