// path: src/apps/arc-jurassic/core/calcDinoCost.ts
// Pure Mathematical Engine for Dino Purchase Economics

export interface DinoCostResult {
    timeMinutes: number;
    timeSeconds: number;
    dnaCost: number;
    redOrbCost: number;
    isSpecial: boolean;
    costLabel: string;
}

/**
 * Calculates the purchasing cost for a dinosaur based on game rules:
 * - Standard: Time (hatch_time_mins / 2) + DNA (sell_price_dna).
 * - Special ("super-hybrid" or "boss"): Time (hatch_time_mins / 2) + RED Orbs (ceil(max_ferocity / 365)).
 */
export function calcDinoCost(dino: any): DinoCostResult {
    const hatchMins = Number(dino?.hatch_time_mins || 0);
    const timeMinutes = Number((hatchMins / 2).toFixed(2));
    const timeSeconds = Math.round(timeMinutes * 60);

    const hybridType = String(dino?.hybrid_type || '').toLowerCase().trim();
    const rarity = String(dino?.rarity || '').toLowerCase().trim();
    const dinoClass = String(dino?.class || '').toLowerCase().trim();

    const isSpecial = hybridType === 'super-hybrid' || rarity === 'boss' || dinoClass === 'boss';

    let dnaCost = 0;
    let redOrbCost = 0;

    if (isSpecial) {
        const maxFero = Number(
            dino?.max_ferocity ||
            dino?.evo4_ferocity ||
            (dino?.evolutions?.[dino.evolutions.length - 1]?.ferocity) ||
            1
        );
        redOrbCost = Math.max(1, Math.ceil(maxFero / 365));
    } else {
        dnaCost = Number(dino?.sell_price_dna || 0);
    }

    const costLabel = isSpecial
        ? `${timeMinutes}m + ${redOrbCost} Red Orbs`
        : `${timeMinutes}m + ${dnaCost.toLocaleString()} DNA`;

    return {
        timeMinutes,
        timeSeconds,
        dnaCost,
        redOrbCost,
        isSpecial,
        costLabel,
    };
}
