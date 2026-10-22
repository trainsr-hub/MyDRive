import React, { useState, useMemo } from 'react';
import { GachaInitWorker } from './workers/GachaInitWorker/GachaInitWorker';
import { GachaAnimationWorker } from './workers/GachaAnimationWorker/GachaAnimationWorker';
import { GachaResultWorker } from './workers/GachaResultWorker/GachaResultWorker';
import { calcGachaPool, selectWeightedRoll } from '../../../core/calcGachaPool';
import { calcDinoCost } from '../../../core/calcDinoCost';
import type { GachaStep, DueDinoData } from './types';

interface GachaTabProps {
    objects: any[];
    lookup: any;
    userFerocity: number;
    excludedIds: string[];
    userProgress: any;
    myResources: any;
    isFreeBuyCheat?: boolean;
    dueDino?: DueDinoData | null;
    onSetDueDino?: (data: DueDinoData | null) => void;
    onUpdateResources: (newRes: any) => void;
    onUpdateProgress: (newProg: any) => void;
    onBuySuccess: (uuid: string) => void;
    animationSrc?: string;
}

/**
 * Commander: GachaTab (Faust Prime Navigator)
 * Responsibility: Pure orchestrator.
 * Enforces Due Dino Lifecycle:
 * - Default view is always Gacha Init View (`gachaStep = 'init'`).
 * - If a due dinosaur exists, the player can inspect it or click "Summon", which redirects to the due dinosaur.
 * - In the Result view, players can click "Return to Gacha" to close the window back to Init at any time.
 * - Skipping/Purging the due dinosaur is enabled exclusively in God Mode (Free Buy Cheat).
 */
export const GachaTab: React.FC<GachaTabProps> = ({
    objects,
    lookup,
    excludedIds,
    userProgress,
    myResources,
    isFreeBuyCheat = false,
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
    const [pendingUuid, setPendingUuid] = useState<string | null>(null);
    const [rolledMultiplier, setRolledMultiplier] = useState<number>(1);
    const [isBuying, setIsBuying] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);

    // Calculate outcomes pool with ingredient-inflated rates, ferocity gating, and top 3 vanguard
    const poolResult = useMemo(() => {
        return calcGachaPool(objects, userProgress, excludedIds);
    }, [objects, userProgress, excludedIds]);

    const { pool: possibleOutcomes, cap, top3Ferocity, top3Dinos, nextUnlock } = poolResult;

    // Dispatcher: Step 1 -> Step 2 (Start Animation OR Redirect to existing Due Dino)
    const handleStartSummon = (multiplier: number = 1) => {
        // If there is an outstanding unbought due dinosaur, redirect to it immediately without re-rolling
        if (dueDino) {
            setResultUuid(dueDino.uuid);
            setRolledMultiplier(dueDino.multiplier);
            setGachaStep('result');
            return;
        }

        if (gachaStep !== 'init' || possibleOutcomes.length === 0) return;

        // Perform dynamic weighted random pull based on calculated drop rate weights
        const roll = selectWeightedRoll(possibleOutcomes);
        if (!roll) return;

        setRolledMultiplier(Math.max(1, multiplier));
        setPendingUuid(roll.uuid);
        setGachaStep('animating');
    };

    // Dispatcher: Step 2 -> Step 3 (Animation finished -> Persist as Due Dino & Show Result)
    const handleAnimationComplete = async () => {
        if (pendingUuid) {
            const newDue: DueDinoData = {
                uuid: pendingUuid,
                multiplier: rolledMultiplier
            };
            if (onSetDueDino) {
                onSetDueDino(newDue);
            }
            setResultUuid(pendingUuid);
            setPendingUuid(null);
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
        const maxCapacity = Number(dino.maximum_number || Math.pow(2, Math.max(0, (dino.evolutions?.length || 1) - 1)));
        const maxBuyable = Math.max(1, maxCapacity - currentCount);
        const buyQty = Math.min(Math.max(1, quantity), maxBuyable);

        const totalTimeSeconds = cost.timeSeconds * buyQty;
        const totalTimeMinutes = Number((cost.timeMinutes * buyQty).toFixed(2));
        const totalRedOrbs = cost.redOrbCost * buyQty;
        const totalDNA = cost.dnaCost * buyQty;

        // If cheat is disabled, perform resource validation and deduction against dedicated currencies
        if (!isFreeBuyCheat) {
            const newRes = { ...myResources };
            const currentJurassicTime = Number(newRes.jurassic_time?.amount ?? newRes.elemental_time?.golden?.amount ?? 0);
            const currentDNA = Number(newRes.dna?.amount ?? newRes.elemental_time?.jurassic?.amount ?? newRes.dna ?? 0);
            const currentRedOrbs = Number(newRes.red_orbs?.amount ?? newRes.orbs?.red_orb?.amount ?? 0);

            // 1. Validate Jurassic Time
            if (currentJurassicTime < totalTimeSeconds) {
                alert(`Not enough Jurassic Time! Requires ${totalTimeMinutes} mins (${totalTimeSeconds}s).`);
                setIsBuying(false);
                return;
            }

            // 2. Validate Special vs Standard Currency
            if (cost.isSpecial) {
                if (currentRedOrbs < totalRedOrbs) {
                    alert(`Not enough Red Orbs! Requires ${totalRedOrbs} Red Orbs.`);
                    setIsBuying(false);
                    return;
                }
            } else {
                if (totalDNA > 0 && currentDNA < totalDNA) {
                    alert(`Not enough DNA! Requires ${totalDNA.toLocaleString()} DNA.`);
                    setIsBuying(false);
                    return;
                }
            }

            // 3. Deduct resources
            newRes.jurassic_time = {
                ...newRes.jurassic_time,
                amount: Math.max(0, Number((currentJurassicTime - totalTimeSeconds).toFixed(2)))
            };

            if (cost.isSpecial) {
                newRes.red_orbs = {
                    ...newRes.red_orbs,
                    amount: Math.max(0, Number((currentRedOrbs - totalRedOrbs).toFixed(2)))
                };
            } else if (totalDNA > 0) {
                newRes.dna = {
                    ...newRes.dna,
                    amount: Math.max(0, Math.round(currentDNA - totalDNA))
                };
            }

            onUpdateResources(newRes);
        }

        // Update progress
        const newProg = { ...userProgress, owned_dinos: { ...(userProgress?.owned_dinos || {}) } };
        const updatedCount = currentCount + buyQty;
        newProg.owned_dinos[resultUuid] = {
            number: updatedCount,
            rank: 1 + Math.floor(Math.log2(updatedCount))
        };
        onUpdateProgress(newProg);

        // Clear Due Dino on successful purchase
        if (onSetDueDino) {
            onSetDueDino(null);
        }

        alert(isFreeBuyCheat
            ? `[GOD MODE] Free Purchase of ${buyQty}x ${dino?.name || 'Dinosaur'} successful!`
            : `Purchase of ${buyQty}x ${dino?.name || 'Dinosaur'} successful!`
        );

        const boughtUuid = resultUuid;
        setResultUuid(null);
        setIsBuying(false);
        setGachaStep('init');

        onBuySuccess(boughtUuid);
    };

    return (
        <div className="w-full flex flex-col items-center relative py-2">
            {/* STEP 1: DELEGATE TO INIT WORKER (Pre-Roll Gamble Multiplier Selection) */}
            {gachaStep === 'init' && (
                <GachaInitWorker
                    possibleOutcomes={possibleOutcomes}
                    top3Dinos={top3Dinos}
                    top3Ferocity={top3Ferocity}
                    lookup={lookup}
                    cap={cap}
                    nextUnlock={nextUnlock}
                    dueDino={dueDino}
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
                    rolledMultiplier={rolledMultiplier}
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
