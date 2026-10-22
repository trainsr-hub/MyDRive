// path: src/apps/arc-jurassic/core/calcDinoCost.ts
// Pure Mathematical Engine for Dino Purchase Economics

import { rutGonTime } from './rutGonTime';

export interface DinoCostResult {
    timeMinutes: number;
    timeSeconds: number;
    formattedTime: string;
    totalTimeSeconds: number;
    costLabel: string;
}

/**
 * Calculates the purchasing cost for a dinosaur using unified Time currency:
 * - Base Time: hatch_time_mins / 2 (converted to seconds)
 * - DNA Conversion: 1000 DNA = 1 Day (86400 seconds)
 * - Red Orb Conversion: 50 Red Orbs = 1 Day (86400 seconds)
 * Total cost = Base Time + Converted DNA Time + Converted Red Orb Time
 */
export function calcDinoCost(dino: any): DinoCostResult {
    const hatchMins = Number(dino?.hatch_time_mins || 0);
    const baseTimeMinutes = Number((hatchMins / 2).toFixed(2));
    const baseTimeSeconds = Math.round(baseTimeMinutes * 60);

    const hybridType = String(dino?.hybrid_type || '').toLowerCase().trim();
    const rarity = String(dino?.rarity || '').toLowerCase().trim();
    const dinoClass = String(dino?.class || '').toLowerCase().trim();

    const isSpecial = hybridType === 'super-hybrid' || rarity === 'boss' || dinoClass === 'boss';

    let additionalTimeFromCurrency = 0;

    if (isSpecial) {
        // Special dinosaurs use Red Orbs: 50 Red Orbs = 1 Day (86400 seconds)
        const maxFero = Number(
            dino?.max_ferocity ||
            dino?.evo4_ferocity ||
            (dino?.evolutions?.[dino.evolutions.length - 1]?.ferocity) ||
            1
        );
        const redOrbCost = Math.max(1, Math.ceil(maxFero / 365));
        additionalTimeFromCurrency = Math.round((redOrbCost / 50) * 86400); // Convert Red Orbs to seconds
    } else {
        // Standard dinosaurs use DNA: 1000 DNA = 1 Day (86400 seconds)
        const dnaCost = Number(dino?.sell_price_dna || 0);
        additionalTimeFromCurrency = Math.round((dnaCost / 1000) * 86400); // Convert DNA to seconds
    }

    const totalTimeSeconds = baseTimeSeconds + additionalTimeFromCurrency;
    const formattedTime = rutGonTime(totalTimeSeconds, "seconds");

    const costLabel = `${formattedTime}`;

    return {
        timeMinutes: baseTimeMinutes,
        timeSeconds: baseTimeSeconds,
        formattedTime,
        totalTimeSeconds,
        costLabel,
    };
}
