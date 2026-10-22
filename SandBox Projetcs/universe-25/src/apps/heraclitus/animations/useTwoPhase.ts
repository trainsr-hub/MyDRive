// path: src/apps/heraclitus/animations/useTwoPhase.ts
// Tier 3: React integration — hook for phase orchestration

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  TwoPhaseConfig,
  TwoPhaseState,
} from './twoPhaseEngine';
import {
  DEFAULT_SPOOL_DURATION,
  DEFAULT_SHATTER_DURATION,
  DEFAULT_DISSOLVE_DURATION,
  kineticEase,
  smoothSinkEase,
  createInitialState,
  prefersReducedMotion,
} from './twoPhaseEngine';

/**
 * Hook to orchestrate two-phase kinetic animations
 * Returns current state and trigger/reset functions
 */
export function useTwoPhase(config: TwoPhaseConfig) {
  const {
    spoolDuration = DEFAULT_SPOOL_DURATION,
    shatterDuration = DEFAULT_SHATTER_DURATION,
    dissolveDuration = DEFAULT_DISSOLVE_DURATION,
    easing = 'kinetic',
    respectReducedMotion = true,
    onPhaseChange,
    onComplete,
  } = config;

  const [state, setState] = useState<TwoPhaseState>(createInitialState());
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const spoolStartTimeRef = useRef<number>(0);
  const shatterStartTimeRef = useRef<number>(0);
  const dissolveStartTimeRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!isMountedRef.current) return;

    let newState: TwoPhaseState = { ...state };

    switch (state.phase) {
      case 'spooling':
        const spoolElapsed = timestamp - spoolStartTimeRef.current;
        const spoolProgress = Math.min(spoolElapsed / spoolDuration, 1);
        const easedSpoolProgress = easing === 'kinetic'
          ? kineticEase(spoolProgress)
          : easing === 'smooth-sink'
          ? smoothSinkEase(spoolProgress)
          : spoolProgress;

        newState.spoolProgress = easedSpoolProgress;
        newState.progress = easedSpoolProgress;

        if (spoolProgress >= 1) {
          // Transition to shatter
          newState.phase = 'shattering';
          newState.progress = 0;
          shatterStartTimeRef.current = timestamp;
          if (onPhaseChange) onPhaseChange('shattering');
        }
        break;

      case 'shattering':
        const shatterElapsed = timestamp - shatterStartTimeRef.current;
        const shatterProgress = Math.min(shatterElapsed / shatterDuration, 1);
        newState.shatterProgress = shatterProgress;
        newState.progress = shatterProgress;

        if (shatterProgress >= 1) {
          // Transition to dissolve (smooth sink fade)
          newState.phase = 'dissolving';
          newState.progress = 0;
          dissolveStartTimeRef.current = timestamp;
          if (onPhaseChange) onPhaseChange('dissolving');
        }
        break;

      case 'dissolving':
        const dissolveElapsed = timestamp - dissolveStartTimeRef.current;
        const dissolveProgress = Math.min(dissolveElapsed / dissolveDuration, 1);
        const easedDissolveProgress = smoothSinkEase(dissolveProgress); // Always use smooth sink for dissolve
        newState.dissolveProgress = easedDissolveProgress;
        newState.progress = easedDissolveProgress;

        if (dissolveProgress >= 1) {
          // Animation complete
          newState.phase = 'complete';
          newState.progress = 1;
          if (onPhaseChange) onPhaseChange('complete');
          if (onComplete) onComplete();
        }
        break;

      default:
        break;
    }

    // Update state if changed
    if (
      newState.phase !== state.phase ||
      Math.abs(newState.progress - state.progress) > 0.001 ||
      Math.abs(newState.spoolProgress - state.spoolProgress) > 0.001 ||
      Math.abs(newState.shatterProgress - state.shatterProgress) > 0.001 ||
      Math.abs(newState.dissolveProgress - state.dissolveProgress) > 0.001
    ) {
      setState(newState);
    }

    // Request next frame
    if (state.phase !== 'idle' && state.phase !== 'complete') {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [
    state.phase,
    state.progress,
    state.spoolProgress,
    state.shatterProgress,
    state.dissolveProgress,
    spoolDuration,
    shatterDuration,
    dissolveDuration,
    easing,
    onPhaseChange,
    onComplete,
  ]);

  // Trigger the animation sequence
  const trigger = useCallback(() => {
    if (respectReducedMotion && prefersReducedMotion()) {
      // Skip animation but call complete callback
      if (onComplete) onComplete();
      return;
    }

    // Reset state
    setState(createInitialState());

    // Start spooling phase
    const now = performance.now();
    startTimeRef.current = now;
    spoolStartTimeRef.current = now;

    setState({
      phase: 'spooling',
      progress: 0,
      spoolProgress: 0,
      shatterProgress: 0,
      dissolveProgress: 0,
    });

    if (onPhaseChange) onPhaseChange('spooling');

    // Start animation loop
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [respectReducedMotion, onComplete, onPhaseChange, animate]);

  // Reset to idle state
  const reset = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setState(createInitialState());
  }, []);

  return {
    state,
    trigger,
    reset,
    isActive: state.phase !== 'idle' && state.phase !== 'complete',
    isComplete: state.phase === 'complete',
  };
}