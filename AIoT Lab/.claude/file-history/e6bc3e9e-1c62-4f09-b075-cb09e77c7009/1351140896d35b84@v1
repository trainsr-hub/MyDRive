import React, { useEffect, useRef, useCallback } from 'react';
import { FastForward } from 'lucide-react';
import type { GachaAnimationWorkerProps } from '../../types';
import './GachaAnimationWorker.css';

/**
 * Worker: GachaAnimationWorker
 * Responsibility: Universal Plug-and-Play HTML Animation Player with Instant Skipping.
 * - Executes any standalone .html animation file seamlessly without artificial box borders.
 * - Supports universal instant skip: clicking anywhere on screen, pointer tap, or pressing Space/Enter/Escape.
 * - Displays an interactive, animated skip hint badge.
 */
export const GachaAnimationWorker: React.FC<GachaAnimationWorkerProps> = ({
    animationSrc,
    onComplete
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const hasCompletedRef = useRef(false);

    const handleSkip = useCallback(() => {
        if (hasCompletedRef.current) return;
        hasCompletedRef.current = true;
        onComplete();
    }, [onComplete]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (
                event.data?.type === 'GACHA_ANIMATION_COMPLETE' ||
                event.data === 'GACHA_ANIMATION_COMPLETE'
            ) {
                handleSkip();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === ' ' || event.key === 'Enter' || event.key === 'Escape') {
                event.preventDefault();
                handleSkip();
            }
        };

        const handleGlobalPointer = () => {
            handleSkip();
        };

        window.addEventListener('message', handleMessage);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('pointerdown', handleGlobalPointer);

        return () => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('pointerdown', handleGlobalPointer);
        };
    }, [handleSkip]);

    return (
        <div
            className="gacha-animation-worker-container"
            onClick={handleSkip}
            title="Click anywhere to skip animation"
        >
            {/* Interactive Skip Pill Overlay */}
            <div className="gacha-animation-skip-badge" onClick={handleSkip}>
                <FastForward className="w-3.5 h-3.5 text-[#ffd86b] animate-pulse" />
                <span>Click anywhere or press Space to skip</span>
            </div>

            <iframe
                ref={iframeRef}
                src={animationSrc}
                title="Gacha Animation Stage"
                className="gacha-animation-worker-iframe"
                sandbox="allow-scripts allow-same-origin"
                allowTransparency={true}
            />
        </div>
    );
};

