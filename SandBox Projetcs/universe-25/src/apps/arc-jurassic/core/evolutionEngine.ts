// path: src/apps/arc-jurassic/core/evolutionEngine.ts
/**
 * Evolution Engine for ARC Jurassic (Single Source of Truth)
 *
 * Rules:
 * - Pure exponential doubling progression: 2^(e - 1) for all evolution ranks.
 * - Standard 4-evo dino thresholds: [1, 2, 4, 8] (max capacity = 8)
 * - 10-evo boss/heroic dino thresholds: [1, 2, 4, 8, 16, 32, 64, 128, 256, 512] (max capacity = 512)
 * - No clamping at Evo 4+: each tier doubles the previous requirement.
 */

export function getDinoThresholds(evoCount: number = 4): number[] {
    const total = Math.max(1, evoCount);
    const thresholds: number[] = [];
    for (let e = 1; e <= total; e++) {
        thresholds.push(Math.pow(2, e - 1));
    }
    return thresholds;
}

export function calcDinoMaxCapacity(dinoOrEvoCount: any): number {
    let evoCount = 4;
    if (typeof dinoOrEvoCount === 'number') {
        evoCount = dinoOrEvoCount;
    } else if (dinoOrEvoCount && Array.isArray(dinoOrEvoCount.evolutions)) {
        evoCount = dinoOrEvoCount.evolutions.length;
    }
    const thresholds = getDinoThresholds(evoCount);
    return thresholds[thresholds.length - 1] || 8;
}

/**
 * Calculates current unlocked evolution rank (0 if unowned, 1..evoCount if owned).
 */
export function calcDinoRank(ownedCount: number, evoCount: number = 4): number {
    if (!ownedCount || ownedCount <= 0) return 0;
    const thresholds = getDinoThresholds(evoCount);
    let rank = 0;
    for (let i = 0; i < thresholds.length; i++) {
        if (ownedCount >= thresholds[i]) {
            rank = i + 1;
        } else {
            break;
        }
    }
    return Math.min(rank, evoCount);
}

/**
 * Checks if a specific evolution tier (0-indexed or 1-indexed) is unlocked.
 */
export function isDinoEvoUnlocked(ownedCount: number, evoRankOrIndex: number, evoCount: number = 4, isZeroIndexed: boolean = false): boolean {
    const targetRank = isZeroIndexed ? evoRankOrIndex + 1 : evoRankOrIndex;
    const currentRank = calcDinoRank(ownedCount, evoCount);
    return currentRank >= targetRank;
}

/**
 * Resolves the visual avatar image URL for a dinosaur evolution tier.
 * For Boss dinosaurs (rarity: 'boss'), visual avatars are capped at EVO 3 (index 2 / _evo3.png)
 * since no EVO 4+ visual assets exist, while preserving full stat scaling up to EVO 10 (LV 100).
 */
export function getDinoAvatarUrl(dino: any, rankOrEvoIndex: number, isZeroIndexed: boolean = false): string {
    if (!dino) return '';
    const evolutions = Array.isArray(dino.evolutions) ? dino.evolutions : [];
    if (evolutions.length === 0) return dino.image_url || '';
    const rawIndex = isZeroIndexed ? rankOrEvoIndex : rankOrEvoIndex - 1;
    const clampedIndex = Math.min(Math.max(0, rawIndex), evolutions.length - 1);
    const isBoss = (dino.rarity || '').toLowerCase() === 'boss';
    const effectiveIndex = isBoss ? Math.min(clampedIndex, 2) : clampedIndex;
    return evolutions[effectiveIndex]?.image_url || evolutions[0]?.image_url || dino.image_url || '';
}

/**
 * Retrieves active evolution object and combat statistics.
 */
export function calcDinoActiveStats(dino: any, ownedCount: number) {
    const evolutions = Array.isArray(dino?.evolutions) ? dino.evolutions : [];
    const evoCount = evolutions.length || 4;
    const rank = calcDinoRank(ownedCount, evoCount);
    const isUnlocked = ownedCount > 0 && rank > 0;
    const maxCapacity = calcDinoMaxCapacity(evoCount);

    if (evolutions.length === 0) {
        return {
            rank: 0,
            level: 0,
            damage: 0,
            health: 0,
            ferocity: 0,
            image_url: dino?.image_url || '',
            evo: null,
            isUnlocked: false,
            ownedCount,
            maxCapacity
        };
    }

    if (!isUnlocked) {
        // For locked dinos: display base Evo 1 avatar with max-potential stats
        const baseEvo = evolutions[0];
        const maxEvo = evolutions[evolutions.length - 1];
        const damage = Number(maxEvo.damage || baseEvo.damage || 0);
        const health = Number(maxEvo.health || baseEvo.health || 0);
        const ferocity = maxEvo.ferocity !== undefined
            ? Number(maxEvo.ferocity)
            : Math.floor(damage + (health / 3.2));

        return {
            rank: 0,
            level: 0,
            damage,
            health,
            ferocity,
            image_url: getDinoAvatarUrl(dino, 1, false),
            evo: baseEvo,
            isUnlocked: false,
            ownedCount: 0,
            maxCapacity
        };
    }

    const targetIndex = Math.min(Math.max(0, rank - 1), evolutions.length - 1);
    const activeEvo = evolutions[targetIndex];
    const damage = Number(activeEvo.damage || 0);
    const health = Number(activeEvo.health || 0);
    const ferocity = activeEvo.ferocity !== undefined
        ? Number(activeEvo.ferocity)
        : Math.floor(damage + (health / 3.2));
    const level = Number(activeEvo.level || rank * 10);
    const avatarUrl = getDinoAvatarUrl(dino, rank, false);

    return {
        rank,
        level,
        damage,
        health,
        ferocity,
        image_url: avatarUrl,
        evo: activeEvo,
        isUnlocked: true,
        ownedCount,
        maxCapacity
    };
}

export function calcDinoCurrentEvo(dino: any, rank: number, isUnlocked: boolean = true): any | null {
    const evolutions = dino?.evolutions || [];
    if (evolutions.length === 0) return null;
    if (!isUnlocked || rank <= 0) {
        return evolutions[evolutions.length - 1]; // Preview max evo when locked
    }
    const index = Math.min(Math.max(0, rank - 1), evolutions.length - 1);
    return evolutions[index];
}

export function calcDinoProgressWidth(ownedCount: number, evoCount: number = 4): number {
    if (!ownedCount || ownedCount <= 0) return 0;
    const thresholds = getDinoThresholds(evoCount);
    const N = thresholds.length;
    if (N === 0) return 0;
    if (ownedCount >= thresholds[N - 1]) return 100;

    if (ownedCount < thresholds[0]) {
        const segStart = 0;
        const segEnd = (0.5 / N) * 100;
        return segStart + (ownedCount / thresholds[0]) * (segEnd - segStart);
    }

    for (let i = 1; i < N; i++) {
        const prevThresh = thresholds[i - 1];
        const currThresh = thresholds[i];
        if (ownedCount <= currThresh) {
            const segStart = ((i - 0.5) / N) * 100;
            const segEnd = ((i + 0.5) / N) * 100;
            const fraction = (ownedCount - prevThresh) / (currThresh - prevThresh);
            return segStart + fraction * (segEnd - segStart);
        }
    }

    return 100;
}

/**
 * Calculates the exact number of dinosaur specimens needed to unlock the next Evolution rank (+1 EVO).
 * Examples for standard 4-evo dino (thresholds: [1, 2, 4, 8]):
 * - 0 owned (Unowned) -> Needs 1 to unlock EVO 1 (total = 1)
 * - 1 owned (EVO 1)   -> Needs 1 to unlock EVO 2 (total = 2)
 * - 2 owned (EVO 2)   -> Needs 2 to unlock EVO 3 (total = 4)
 * - 3 owned (EVO 2)   -> Needs 1 to unlock EVO 3 (total = 4)
 * - 4 owned (EVO 3)   -> Needs 4 to unlock EVO 4 (total = 8)
 * - 8 owned (EVO 4)   -> Already max rank -> returns 1 (or remaining to max capacity)
 *
 * Examples for 10-evo boss dino (thresholds: [1, 2, 4, 8, 12, 16, 20, 24, 28, 32]):
 * - 8 owned (EVO 4)   -> Needs 4 to unlock EVO 5 (total = 12)
 * - 12 owned (EVO 5)  -> Needs 4 to unlock EVO 6 (total = 16)
 */
export function calcDinosNeededForNextEvo(ownedCount: number, evoCount: number = 4): number {
    const safeCount = Math.max(0, ownedCount || 0);
    const thresholds = getDinoThresholds(evoCount);
    const currentRank = calcDinoRank(safeCount, evoCount);

    if (currentRank >= evoCount) {
        const maxCapacity = thresholds[thresholds.length - 1];
        const remaining = Math.max(0, maxCapacity - safeCount);
        return remaining > 0 ? remaining : 1;
    }

    const targetThreshold = thresholds[currentRank];
    return Math.max(1, targetThreshold - safeCount);
}

/**
 * Convenience helper to calculate exact specimens needed for next evolution of a given dino.
 */
export function calcDinosNeededForDinoNextEvo(dino: any, userProgress: any): number {
    if (!dino) return 1;
    const uuid = dino.uuid || dino.id || dino.name;
    const ownedData = userProgress?.owned_dinos?.[uuid] || { number: 0 };
    const ownedCount = Number(ownedData.number || 0);
    const evoCount = dino.evolutions?.length || 4;
    return calcDinosNeededForNextEvo(ownedCount, evoCount);
}

/**
 * Calculates the exact number of dinosaur specimens needed to reach Maximum Evolution (Max EVO / Max Capacity).
 * Examples for standard 4-evo dino (max capacity = 8):
 * - 0 owned (Unowned) -> Needs 8 to reach EVO 4 (total = 8)
 * - 1 owned (EVO 1)   -> Needs 7 to reach EVO 4 (total = 8)
 * - 2 owned (EVO 2)   -> Needs 6 to reach EVO 4 (total = 8)
 * - 3 owned (EVO 2)   -> Needs 5 to reach EVO 4 (total = 8)
 * - 4 owned (EVO 3)   -> Needs 4 to reach EVO 4 (total = 8)
 * - 8 owned (EVO 4)   -> Already max rank -> returns 1
 *
 * Examples for 10-evo boss dino (max capacity = 32):
 * - 0 owned (Unowned) -> Needs 32 to reach EVO 10 (total = 32)
 * - 8 owned (EVO 4)   -> Needs 24 to reach EVO 10 (total = 32)
 */
export function calcDinosNeededForMaxEvo(ownedCount: number, evoCount: number = 4): number {
    const safeCount = Math.max(0, ownedCount || 0);
    const thresholds = getDinoThresholds(evoCount);
    const maxCapacity = thresholds[thresholds.length - 1] || 8;
    const remaining = maxCapacity - safeCount;
    return remaining > 0 ? remaining : 1;
}

/**
 * Convenience helper to calculate exact specimens needed for maximum evolution of a given dino.
 */
export function calcDinosNeededForDinoMaxEvo(dino: any, userProgress: any): number {
    if (!dino) return 1;
    const uuid = dino.uuid || dino.id || dino.name;
    const ownedData = userProgress?.owned_dinos?.[uuid] || { number: 0 };
    const ownedCount = Number(ownedData.number || 0);
    const evoCount = dino.evolutions?.length || 4;
    return calcDinosNeededForMaxEvo(ownedCount, evoCount);
}
