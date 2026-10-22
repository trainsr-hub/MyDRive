// path: src/apps/arc-jurassic/core/calcDinoCost.ts
// Pure Mathematical Engine for Dino Purchase Economics
// Unified Temporal Economy: Single Cost = Evolution 1 Ferocity (in seconds)

import { rutGonTime } from './rutGonTime';

export interface DinoCostResult {
    timeMinutes: number;
    timeSeconds: number;
    formattedTime: string;
    totalTimeSeconds: number;
    costLabel: string;
}

/**
 * Calculates the purchasing cost for a dinosaur using pure temporal currency:
 * - Single Cost: evo1_ferocity (ferocity at evolution level 1, the first 10-level evolution)
 * - Result is in seconds
 *
 * All dinosaurs (standard, hybrid, super-hybrid, boss) use the same calculation.
 * No DNA, no Red Orbs—only time.
 */
export function calcDinoCost(dino: any): DinoCostResult {
    // Extract evo1_ferocity (ferocity at evolution level 1)
    // Fallback chain: evo1_ferocity field → evolutions[0].ferocity → max_ferocity → 1
    let evo1Ferocity = Number(dino?.evo1_ferocity || 0);

    if (evo1Ferocity === 0 && dino?.evolutions && dino.evolutions.length > 0) {
        evo1Ferocity = Number(dino.evolutions[0].ferocity || 0);
    }

    if (evo1Ferocity === 0) {
        evo1Ferocity = Number(dino?.max_ferocity || 1);
    }

    // Total cost is evo1_ferocity in seconds
    const totalTimeSeconds = Math.max(1, Math.round(evo1Ferocity));

    // For display purposes, derive minutes (though primary unit is seconds)
    const timeMinutes = Number((totalTimeSeconds / 60).toFixed(2));

    const formattedTime = rutGonTime(totalTimeSeconds, "seconds");
    const costLabel = `${formattedTime}`;

    return {
        timeMinutes,
        timeSeconds: totalTimeSeconds,
        formattedTime,
        totalTimeSeconds,
        costLabel,
    };
}
