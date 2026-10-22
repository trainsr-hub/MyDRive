import React, { useState, useMemo } from 'react';
import { GachaInitWorker } from './workers/GachaInitWorker/GachaInitWorker';
import { GachaAnimationWorker } from './workers/GachaAnimationWorker/GachaAnimationWorker';
import { GachaResultWorker } from './workers/GachaResultWorker/GachaResultWorker';
import { calcGachaPool, selectWeightedRoll } from '../../../core/calcGachaPool';
import { calcDinoCost } from '../../../core/calcDinoCost';
import { rutGonTime } from '../../../core/rutGonTime';
import { calcDinoMaxCapacity, calcDinoRank, calcDinosNeededForDinoNextEvo, calcDinosNeededForDinoMaxEvo } from '../../../core/evolutionEngine';
import type { GachaStep, DueDinoData, BuyAnimationTarget, RollWagerOption, TargetEvoMode } from './types';

interface GachaTabProps {
    objects: any[];
    lookup: any;
    userFerocity: number;
    excludedIds: string[];
    userProgress: any;
    myResources: any;
    isFreeBuyCheat?: boolean;
    isAutoGachaBuy?: boolean;
    dueDino?: DueDinoData | null;
    onSetDueDino?: (data: DueDinoData | null) => void;
    onUpdateResources: (newRes: any) => void;
    onUpdateProgress: (newProg: any) => void;
    onBuySuccess: (summary: BuyAnimationTarget) => void;
    animationSrc?: string;
}

/**
 * Commander: GachaTab (Faust Prime Navigator)
 * Responsibility: Pure orchestrator.
 * Enforces Due Dino Lifecycle & Autonomous Auto Gacha & Buy Loop:
 * - Default view is always Gacha Init View (`gachaStep = 'init'`).
 * - If a due dinosaur exists, the player can inspect it or click "Summon", which redirects to the due dinosaur.
 * - In the Result view, players can click "Return to Gacha" to close the window back to Init at any time.
 * - Skipping/Purging the due dinosaur is enabled exclusively in God Mode (Free Buy Cheat).
 * - Auto Gacha & Buy autonomously drives the Summon -> Buy -> Rank Climb loop when resources permit.
 */
const LOCAL_STORAGE_WAGER_KEY = 'arc_jurassic_roll_wager_v1';

export const GachaTab: React.FC<GachaTabProps> = ({
    objects,
    lookup,
    excludedIds,
    userProgress,
    myResources,
    isFreeBuyCheat = false,
    isAutoGachaBuy = false,
    dueDino = null,
    onSetDueDino,
    onUpdateResources,
    onUpdateProgress,
    onBuySuccess,
    animationSrc = '/animations/black-hole.html'
}) => {
    // Stage router: always starts on 'init' so the user is never forcibly locked on load
    const [gachaStep, setGachaStep] = useState<GachaStep>('init');
    const [resultUuid, setResultUuid] = useState<string | null>(null);
    const [pendingRollData, setPendingRollData] = useState<{
        uuid: string;
        multiplier: number;
        isTargetEvo?: boolean;
        targetEvoMode?: TargetEvoMode;
    } | null>(null);

    // Persist Roll Wager selection across rolls and sessions (number, 'next-evo', or 'max-evo')
    const [selectedWager, setSelectedWager] = useState<RollWagerOption>(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_WAGER_KEY);
            if (saved === 'next-evo' || saved === 'max-evo') return saved;
            const parsed = Number(saved);
            return [1, 2, 3, 4, 8, 16].includes(parsed) ? parsed : 1;
        } catch {
            return 1;
        }
    });

    const [rolledMultiplier, setRolledMultiplier] = useState<number>(1);
    const [isTargetEvoRoll, setIsTargetEvoRoll] = useState<boolean>(false);
    const [targetEvoMode, setTargetEvoMode] = useState<TargetEvoMode | undefined>(undefined);

    const [isBuying, setIsBuying] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);

    // Calculate outcomes pool with ingredient-inflated rates, ferocity gating, and top 3 vanguard
    const poolResult = useMemo(() => {
        return calcGachaPool(objects, userProgress, excludedIds);
    }, [objects, userProgress, excludedIds]);

    const { pool: possibleOutcomes, cap, top3Ferocity, top3Dinos, topDinos, nextUnlock } = poolResult;

    const handleSelectWager = (wager: RollWagerOption) => {
        setSelectedWager(wager);
        try {
            localStorage.setItem(LOCAL_STORAGE_WAGER_KEY, String(wager));
        } catch (e) {
            console.warn('Failed to save wager to localStorage:', e);
        }
    };

    // Dispatcher: Step 1 -> Step 2 (Start Animation OR Redirect to existing Due Dino)
    const handleStartSummon = (multiplier: RollWagerOption = 1) => {
        // If there is an outstanding unbought due dinosaur, redirect to it immediately without re-rolling
        if (dueDino) {
            setResultUuid(dueDino.uuid);
            setRolledMultiplier(dueDino.multiplier);
            setIsTargetEvoRoll(Boolean(dueDino.isTargetEvo));
            setTargetEvoMode(dueDino.targetEvoMode);
            setGachaStep('result');
            return;
        }

        if (gachaStep !== 'init' || possibleOutcomes.length === 0) return;

        // Perform dynamic weighted random pull based on calculated drop rate weights
        const roll = selectWeightedRoll(possibleOutcomes);
        if (!roll) return;

        let calculatedMultiplier = 1;
        let isTargetEvo = false;
        let evoMode: TargetEvoMode | undefined = undefined;

        if (multiplier === 'next-evo') {
            isTargetEvo = true;
            evoMode = 'next-evo';
            const dinoObj = objects.find(o => (o.uuid || o.id || o.name) === roll.uuid);
            calculatedMultiplier = calcDinosNeededForDinoNextEvo(dinoObj || roll, userProgress);
        } else if (multiplier === 'max-evo') {
            isTargetEvo = true;
            evoMode = 'max-evo';
            const dinoObj = objects.find(o => (o.uuid || o.id || o.name) === roll.uuid);
            calculatedMultiplier = calcDinosNeededForDinoMaxEvo(dinoObj || roll, userProgress);
        } else {
            const num = typeof multiplier === 'number' ? multiplier : Number(multiplier);
            calculatedMultiplier = isNaN(num) || num < 1 ? 1 : num;
        }

        setRolledMultiplier(calculatedMultiplier);
        setIsTargetEvoRoll(isTargetEvo);
        setTargetEvoMode(evoMode);

        // In Auto Gacha & Buy mode: Bypass Black Hole summon animation completely and enter Result state directly
        if (isAutoGachaBuy) {
            const newDue: DueDinoData = {
                uuid: roll.uuid,
                multiplier: calculatedMultiplier,
                isTargetEvo,
                targetEvoMode: evoMode
            };
            if (onSetDueDino) {
                onSetDueDino(newDue);
            }
            setResultUuid(roll.uuid);
            setPendingRollData(null);
            setGachaStep('result');
            return;
        }

        setPendingRollData({
            uuid: roll.uuid,
            multiplier: calculatedMultiplier,
            isTargetEvo,
            targetEvoMode: evoMode
        });
        setGachaStep('animating');
    };

    // Dispatcher: Step 2 -> Step 3 (Animation finished -> Persist as Due Dino & Show Result)
    const handleAnimationComplete = async () => {
        if (pendingRollData) {
            const newDue: DueDinoData = {
                uuid: pendingRollData.uuid,
                multiplier: pendingRollData.multiplier,
                isTargetEvo: pendingRollData.isTargetEvo,
                targetEvoMode: pendingRollData.targetEvoMode
            };
            if (onSetDueDino) {
                onSetDueDino(newDue);
            }
            setResultUuid(pendingRollData.uuid);
            setRolledMultiplier(pendingRollData.multiplier);
            setIsTargetEvoRoll(Boolean(pendingRollData.isTargetEvo));
            setTargetEvoMode(pendingRollData.targetEvoMode);
            setPendingRollData(null);
            setGachaStep('result');
        }
    };

    // Dispatcher: Result Window -> Dismiss back to Init View (Dino stays due)
    const handleCloseToInit = () => {
        setResultUuid(null);
        setGachaStep('init');
    };

    // Dispatcher: God Mode Skip (Purges due dino from memory)
    const handleGodModeSkip = async () => {
        if (!isFreeBuyCheat) return;

        if (isSkipping) return;
        setIsSkipping(true);
        try {
            if (onSetDueDino) {
                onSetDueDino(null);
            }
            setResultUuid(null);
            setGachaStep('init');
        } finally {
            setIsSkipping(false);
        }
    };

    // Dispatcher: Step 3 -> Step 1 (Buy dino -> Clear Due Dino & Return to Init)
    const handleBuy = async (quantity: number = 1) => {
        if (isBuying || !resultUuid) return;
        setIsBuying(true);

        const dino = objects.find(o => (o.uuid || o.id || o.name) === resultUuid);
        if (!dino) {
            setIsBuying(false);
            return;
        }

        const cost = calcDinoCost(dino);

        const currentData = userProgress?.owned_dinos?.[resultUuid] || { number: 0, rank: 0 };
        const currentCount = Number(currentData.number || 0);
        const maxCapacity = calcDinoMaxCapacity(dino);
        const maxBuyable = Math.max(1, maxCapacity - currentCount);
        const buyQty = Math.min(Math.max(1, quantity), maxBuyable);

        const totalTimeSeconds = cost.totalTimeSeconds * buyQty;

        // If cheat is disabled, perform resource validation and deduction against unified Time currency
        if (!isFreeBuyCheat) {
            const newRes = { ...myResources };
            const currentJurassicTime = Number(newRes.jurassic_time?.amount ?? newRes.elemental_time?.golden?.amount ?? 0);

            // Validate unified Time currency
            if (currentJurassicTime < totalTimeSeconds) {
                alert(`Not enough Jurassic Time! Requires ${rutGonTime(totalTimeSeconds, 'seconds')}.`);
                setIsBuying(false);
                return;
            }

            // Deduct unified Time
            newRes.jurassic_time = {
                ...newRes.jurassic_time,
                amount: Math.max(0, Number((currentJurassicTime - totalTimeSeconds).toFixed(2)))
            };

            onUpdateResources(newRes);
        }

        // Calculate pool before progress update
        const prevPoolResult = calcGachaPool(objects, userProgress, excludedIds);
        const prevPoolSet = new Set(prevPoolResult.pool.map(p => p.uuid));
        const prevCap = prevPoolResult.cap;
        const targetPoolDino = prevPoolResult.pool.find(p => p.uuid === resultUuid);
        const dropRatePercent = targetPoolDino ? targetPoolDino.dropRatePercent : undefined;

        // Update progress with new evolution rank
        const newProg = { ...userProgress, owned_dinos: { ...(userProgress?.owned_dinos || {}) } };
        const updatedCount = currentCount + buyQty;
        const evoCount = dino.evolutions?.length || 4;
        const prevRank = calcDinoRank(currentCount, evoCount);
        const newRank = calcDinoRank(updatedCount, evoCount);
        const wasFirstBuy = currentCount === 0;

        newProg.owned_dinos[resultUuid] = {
            number: updatedCount,
            rank: newRank
        };
        onUpdateProgress(newProg);

        // Calculate pool after progress update
        const postPoolResult = calcGachaPool(objects, newProg, excludedIds);
        const newCap = postPoolResult.cap;
        const newlyUnlockedPoolDinos = postPoolResult.pool.filter(p => !prevPoolSet.has(p.uuid));

        // Clear Due Dino on successful purchase
        if (onSetDueDino) {
            onSetDueDino(null);
        }

        const boughtUuid = resultUuid;
        setResultUuid(null);
        setIsBuying(false);
        setGachaStep('init');

        onBuySuccess({
            uuid: boughtUuid,
            wasFirstBuy,
            prevRank,
            newRank,
            buyQty,
            dropRatePercent,
            newlyUnlockedPoolDinos,
            prevCap,
            newCap
        });
    };

    return (
        <div className="w-full flex flex-col items-center relative py-2">
            {/* STEP 1: DELEGATE TO INIT WORKER (Pre-Roll Gamble Multiplier Selection) */}
            {gachaStep === 'init' && (
                <GachaInitWorker
                    possibleOutcomes={possibleOutcomes}
                    top3Dinos={top3Dinos}
                    topDinos={topDinos}
                    top3Ferocity={top3Ferocity}
                    lookup={lookup}
                    cap={cap}
                    nextUnlock={nextUnlock}
                    dueDino={dueDino}
                    selectedMultiplier={selectedWager}
                    onSelectMultiplier={handleSelectWager}
                    onStartSummon={handleStartSummon}
                />
            )}

            {/* STEP 2: DELEGATE TO ANIMATION WORKER */}
            {gachaStep === 'animating' && (
                <GachaAnimationWorker
                    animationSrc={animationSrc}
                    onComplete={handleAnimationComplete}
                />
            )}

            {/* STEP 3: DELEGATE TO RESULT WORKER */}
            {gachaStep === 'result' && resultUuid && (
                <GachaResultWorker
                    resultUuid={resultUuid}
                    objects={objects}
                    lookup={lookup}
                    userProgress={userProgress}
                    myResources={myResources}
                    possibleOutcomes={possibleOutcomes}
                    rolledMultiplier={rolledMultiplier}
                    isTargetEvoRoll={isTargetEvoRoll}
                    targetEvoMode={targetEvoMode}
                    isBuying={isBuying}
                    isSkipping={isSkipping}
                    isFreeBuyCheat={isFreeBuyCheat}
                    onBuy={handleBuy}
                    onCloseToInit={handleCloseToInit}
                    onGodModeSkip={handleGodModeSkip}
                />
            )}
        </div>
    );
};
