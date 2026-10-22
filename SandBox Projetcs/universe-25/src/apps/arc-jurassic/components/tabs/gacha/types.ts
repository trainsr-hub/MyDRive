// path: src/apps/arc-jurassic/components/tabs/gacha/types.ts
// Contract definition for Gacha Commander & Worker Hierarchy

import type { PoolDino, TopDinoInfo, NextUnlockMilestone } from '../../../core/calcGachaPool';
import type { DinoCostResult } from '../../../core/calcDinoCost';

export type { PoolDino, TopDinoInfo, NextUnlockMilestone, DinoCostResult };

export type RollWagerOption = number | 'next-evo' | 'max-evo';

export type TargetEvoMode = 'next-evo' | 'max-evo';

export interface DueDinoData {
    uuid: string;
    multiplier: number;
    isTargetEvo?: boolean;
    targetEvoMode?: TargetEvoMode;
}

export interface BuyAnimationTarget {
    uuid: string;
    wasFirstBuy: boolean;
    prevRank: number;
    newRank: number;
    buyQty: number;
    dropRatePercent?: number;
    newlyUnlockedPoolDinos?: PoolDino[];
    prevCap?: number;
    newCap?: number;
    costSeconds?: number;
    remainingTimeSeconds?: number;
    isFinalRoll?: boolean;
}

export type GachaStep = 'init' | 'animating' | 'result';

export interface GachaInitWorkerProps {
    possibleOutcomes: PoolDino[];
    top3Dinos: TopDinoInfo[];
    topDinos?: TopDinoInfo[];
    top3Ferocity: number;
    lookup: any;
    cap: number;
    nextUnlock: NextUnlockMilestone | null;
    dueDino: DueDinoData | null;
    selectedMultiplier: RollWagerOption;
    onSelectMultiplier: (multiplier: RollWagerOption) => void;
    onStartSummon: (multiplier: RollWagerOption) => void;
    animationSrc?: string;
}

export interface GachaTopDinosWorkerProps {
    top3Dinos: TopDinoInfo[];
    topDinos?: TopDinoInfo[];
    top3Ferocity: number;
    cap: number;
    lookup: any;
}

export interface GachaAnimationWorkerProps {
    animationSrc: string;
    onComplete: () => void;
}

export interface GachaResultWorkerProps {
    resultUuid: string;
    objects: any[];
    lookup: any;
    userProgress: any;
    myResources: any;
    possibleOutcomes?: PoolDino[];
    rolledMultiplier: number;
    isTargetEvoRoll?: boolean;
    targetEvoMode?: TargetEvoMode;
    isBuying: boolean;
    isSkipping: boolean;
    isFreeBuyCheat?: boolean;
    onBuy: (quantity: number) => void;
    onCloseToInit: () => void;
    onGodModeSkip: () => void;
}

export interface GachaOutcomesWorkerProps {
    possibleOutcomes: PoolDino[];
    lookup: any;
    cap: number;
    nextUnlock: NextUnlockMilestone | null;
}
