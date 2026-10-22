// path: src/apps/arc-jurassic/core/calcGachaPool.ts
// Pure Mathematical Engine for Gacha Pool Gating, Ingredient Inflation, True Inverse Ferocity Drop Rates, Top 3 Dinos, Total Army Ferocity, and Next Cap Milestones

import { calcDinoCost, type DinoCostResult } from './calcDinoCost';

export interface PoolDino {
    uuid: string;
    name: string;
    rarity: string;
    class?: string;
    hybrid_type?: string;
    ferocity: number; // Base evo4 ferocity
    modifiedFerocity: number; // Ingredient-inflated ferocity
    dropRatePercent: number; // Dynamic calculated drop probability (%)
    rawWeight: number; // Internal normalized inverse weight
    maxDamage: number;
    maxHealth: number;
    maxEvoImg: string;
    evo1Img: string;
    isOwned: boolean;
    ownedCount: number;
    currentRank: number;
    maximumNumber: number;
    image_url?: string;
    hatch_time_mins?: number;
    buy_price_dna?: number;
    sell_price_dna?: number;
    ingredients: string[];
    ownedIngredientsCount: number;
    totalIngredientsCount: number;
    cost: DinoCostResult;
}

export interface TopDinoInfo {
    uuid: string;
    name: string;
    rarity: string;
    class?: string;
    rank: number;
    level: number;
    ownedCount: number;
    ferocity: number;
    damage: number;
    health: number;
    evoImg: string;
    image_url?: string;
}

export interface NextUnlockMilestone {
    uuid: string;
    name: string;
    rarity: string;
    class?: string;
    image_url?: string;
    requiredFerocity: number;
    deltaNeeded: number;
}

export interface GachaPoolResult {
    pool: PoolDino[];
    cap: number;
    top3Ferocity: number;
    totalAllFerocity: number;
    top3Dinos: TopDinoInfo[];
    nextUnlock: NextUnlockMilestone | null;
    totalModifiedFerocity: number;
    excludedIds: string[];
}

/**
 * Retrieves full data on the user's top 3 highest-ferocity active dinos.
 */
export function getUserTop3Dinos(objects: any[], userProgress: any): TopDinoInfo[] {
    const ownedDinos = userProgress?.owned_dinos || {};
    const list: TopDinoInfo[] = [];

    for (const [uuid, data] of Object.entries(ownedDinos)) {
        const ownedData = data as { number?: number; rank?: number; ferocity?: number };
        const number = Number(ownedData.number || 0);
        const rank = Number(ownedData.rank || 0);

        if (number > 0 && rank > 0) {
            const dino = objects.find((d: any) => (d.uuid || d.id || d.name) === uuid);
            if (dino && dino.evolutions?.length > 0) {
                const targetLevel = rank * 10;
                const evo = dino.evolutions.find((e: any) => e.level === targetLevel) || dino.evolutions[Math.min(rank - 1, dino.evolutions.length - 1)];
                if (evo) {
                    const fero = evo.ferocity !== undefined
                        ? Number(evo.ferocity)
                        : Math.floor(Number(evo.damage || 0) + (Number(evo.health || 0) / 3.2));
                    list.push({
                        uuid,
                        name: dino.name || '',
                        rarity: String(dino.rarity || '').toLowerCase(),
                        class: dino.class,
                        rank,
                        level: targetLevel,
                        ownedCount: number,
                        ferocity: fero,
                        damage: Number(evo.damage || 0),
                        health: Number(evo.health || 0),
                        evoImg: evo.image_url || dino.image_url,
                        image_url: dino.image_url,
                    });
                }
            }
        }
    }

    list.sort((a, b) => b.ferocity - a.ferocity || a.name.localeCompare(b.name));
    return list.slice(0, 3);
}

/**
 * Calculates user's top 3 ferocity sum based on highest active evolutions of owned creatures.
 */
export function calcUserTop3Ferocity(objects: any[], userProgress: any): number {
    const top3 = getUserTop3Dinos(objects, userProgress);
    return top3.reduce((sum, d) => sum + d.ferocity, 0);
}

/**
 * Calculates user's total cumulative ferocity across ALL owned dinosaurs at their active unlocked levels.
 */
export function calcUserTotalFerocity(objects: any[], userProgress: any): number {
    const ownedDinos = userProgress?.owned_dinos || {};
    let total = 0;

    for (const [uuid, data] of Object.entries(ownedDinos)) {
        const ownedData = data as { number?: number; rank?: number; ferocity?: number };
        const number = Number(ownedData.number || 0);
        const rank = Number(ownedData.rank || 0);

        if (number > 0 && rank > 0) {
            const dino = objects.find((d: any) => (d.uuid || d.id || d.name) === uuid);
            if (dino && dino.evolutions?.length > 0) {
                const targetLevel = rank * 10;
                const evo = dino.evolutions.find((e: any) => e.level === targetLevel) || dino.evolutions[Math.min(rank - 1, dino.evolutions.length - 1)];
                if (evo) {
                    const fero = evo.ferocity !== undefined
                        ? Number(evo.ferocity)
                        : Math.floor(Number(evo.damage || 0) + (Number(evo.health || 0) / 3.2));
                    total += fero;
                }
            }
        }
    }

    return total;
}

/**
 * Main Gacha Pool Generator:
 * 1. Gates creatures by evo4_ferocity <= max(top3Ferocity, 200).
 * 2. Excludes creatures that reached maximum_number.
 * 3. Applies ingredient-based inflation: modified_ferocity = evo4_ferocity * 2^(16 - min(16, owned_ingredients)).
 * 4. Calculates true inverse ferocity drop rates: w_i = 1 / modified_ferocity (least ferocity -> highest drop rate).
 * 5. Finds the Next Unlock Milestone (the creature with lowest ferocity just above cap).
 * 6. Computes Top 3 Vanguards and Total Army Ferocity.
 */
export function calcGachaPool(
    objects: any[],
    userProgress: any,
    manualExcludedIds: string[] = []
): GachaPoolResult {
    const top3Dinos = getUserTop3Dinos(objects, userProgress);
    const top3Ferocity = top3Dinos.reduce((sum, d) => sum + d.ferocity, 0);
    const totalAllFerocity = calcUserTotalFerocity(objects, userProgress);
    const cap = Math.max(top3Ferocity, 200);
    const ownedDinos = userProgress?.owned_dinos || {};

    const excludedIdsSet = new Set<string>(manualExcludedIds);

    // 1. Identify creatures exceeding max limit
    for (const dino of objects) {
        const uuid = dino.uuid || dino.id || dino.name;
        const evolutions = dino.evolutions || [];
        const maxLimit = Number(dino.maximum_number || Math.pow(2, Math.max(0, evolutions.length - 1)));
        const userCount = Number(ownedDinos[uuid]?.number || 0);

        if (userCount >= maxLimit) {
            excludedIdsSet.add(uuid);
        }
    }

    // 2. Filter eligible creatures & search for Next Unlock Milestone
    const eligibleList: any[] = [];
    const lockedAboveCapList: any[] = [];

    for (const dino of objects) {
        const uuid = dino.uuid || dino.id || dino.name;
        if (excludedIdsSet.has(uuid)) continue;

        const evolutions = dino.evolutions || [];
        if (evolutions.length === 0) continue;

        const evo4 = evolutions[3] || evolutions[evolutions.length - 1];
        const baseEvo4Fero = Number(
            dino.evo4_ferocity ||
            evo4.ferocity ||
            Math.floor(Number(evo4.damage || 0) + (Number(evo4.health || 0) / 3.2))
        );

        if (baseEvo4Fero <= cap) {
            eligibleList.push({
                dino,
                uuid,
                evolutions,
                evo4,
                baseEvo4Fero,
            });
        } else {
            lockedAboveCapList.push({
                uuid,
                name: dino.name || '',
                rarity: String(dino.rarity || '').toLowerCase(),
                class: dino.class,
                image_url: dino.image_url,
                requiredFerocity: baseEvo4Fero,
                deltaNeeded: Math.max(1, baseEvo4Fero - top3Ferocity),
            });
        }
    }

    // Calculate Next Unlock Milestone
    lockedAboveCapList.sort((a, b) => a.requiredFerocity - b.requiredFerocity || a.name.localeCompare(b.name));
    const nextUnlock: NextUnlockMilestone | null = lockedAboveCapList.length > 0 ? lockedAboveCapList[0] : null;

    if (eligibleList.length === 0) {
        return {
            pool: [],
            cap,
            top3Ferocity,
            totalAllFerocity,
            top3Dinos,
            nextUnlock,
            totalModifiedFerocity: 0,
            excludedIds: Array.from(excludedIdsSet),
        };
    }

    // 3. Compute modified ferocity with ingredient inflation
    let totalModifiedFerocity = 0;
    const candidates = eligibleList.map(({ dino, uuid, evolutions, evo4, baseEvo4Fero }) => {
        const ingredients: string[] = Array.isArray(dino.ingredients) ? dino.ingredients : [];
        let ownedIngredientsCount = 0;

        for (const ingUuid of ingredients) {
            ownedIngredientsCount += Number(ownedDinos[ingUuid]?.number || 0);
        }

        const hybridType = String(dino.hybrid_type || '').toLowerCase();
        const hasIngredients = (hybridType === 'hybrid' || hybridType === 'super-hybrid') && ingredients.length > 0;

        // Ingredient Inflation Formula: evo4_ferocity * 2^(16 - min(16, owned_ingredients))
        const exponent = hasIngredients ? Math.max(0, 16 - Math.min(16, ownedIngredientsCount)) : 0;
        const inflationMultiplier = Math.pow(2, exponent);
        const modifiedFerocity = baseEvo4Fero * inflationMultiplier;

        totalModifiedFerocity += modifiedFerocity;

        const userDinoData = ownedDinos[uuid] || { number: 0, rank: 0 };
        const ownedCount = Number(userDinoData.number || 0);
        const currentRank = Number(userDinoData.rank || 0);
        const maximumNumber = Number(dino.maximum_number || Math.pow(2, Math.max(0, evolutions.length - 1)));

        const cost = calcDinoCost(dino);

        return {
            uuid,
            name: dino.name || '',
            rarity: String(dino.rarity || '').toLowerCase(),
            class: dino.class,
            hybrid_type: dino.hybrid_type,
            ferocity: baseEvo4Fero,
            modifiedFerocity,
            rawWeight: 0,
            dropRatePercent: 0,
            maxDamage: Number(evo4.damage || 0),
            maxHealth: Number(evo4.health || 0),
            maxEvoImg: evo4.image_url || dino.image_url,
            evo1Img: evolutions[0]?.image_url || dino.image_url,
            isOwned: ownedCount > 0,
            ownedCount,
            currentRank,
            maximumNumber,
            image_url: dino.image_url,
            hatch_time_mins: dino.hatch_time_mins,
            buy_price_dna: dino.buy_price_dna,
            sell_price_dna: dino.sell_price_dna,
            ingredients,
            ownedIngredientsCount,
            totalIngredientsCount: ingredients.length,
            cost,
        };
    });

    // 4. Calculate true inverse ferocity drop rates: w_i = 1 / modified_ferocity
    let totalInverseWeight = 0;
    for (const item of candidates) {
        item.rawWeight = 1 / Math.max(1, item.modifiedFerocity);
        totalInverseWeight += item.rawWeight;
    }

    for (const item of candidates) {
        item.dropRatePercent = totalInverseWeight > 0
            ? (item.rawWeight / totalInverseWeight) * 100
            : 100 / candidates.length;
    }

    // Sort descending by base ferocity, then by name
    candidates.sort((a, b) => b.ferocity - a.ferocity || a.name.localeCompare(b.name));

    return {
        pool: candidates,
        cap,
        top3Ferocity,
        totalAllFerocity,
        top3Dinos,
        nextUnlock,
        totalModifiedFerocity,
        excludedIds: Array.from(excludedIdsSet),
    };
}

/**
 * Selects a creature from the pool using dynamic weighted random selection.
 */
export function selectWeightedRoll(pool: PoolDino[]): PoolDino | null {
    if (!pool || pool.length === 0) return null;
    if (pool.length === 1) return pool[0];

    const totalWeight = pool.reduce((sum, item) => sum + item.rawWeight, 0);
    let randomVal = Math.random() * totalWeight;

    for (const item of pool) {
        if (randomVal < item.rawWeight) {
            return item;
        }
        randomVal -= item.rawWeight;
    }

    return pool[pool.length - 1];
}
