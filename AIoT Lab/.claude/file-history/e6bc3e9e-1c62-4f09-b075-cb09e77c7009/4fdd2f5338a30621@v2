# Plan: Integrate "2 Phases" Kinetic Animation System into Heraclitus

## Context

The Manager wants to integrate the sophisticated "2 Phases" kinetic animation CSS from `D:\My Drive\SandBox Projetcs\System Design Sandbox\Animations\Accumulating\2 Phases` into the Heraclitus app (`universe-25/src/apps/heraclitus`).

The "2 Phases" system contains 4 distinct animation themes sharing a canonical **2-phase paradigm**:
- **Phase 1 (Spool/Charge)**: Non-linear progression (`Math.pow(spoolProgress, 1.3)`) with screen shake, audio ticks, and visual compression
- **Phase 2 (Shatter/Dissolve)**: Smooth sink fade animation using `cubic-bezier(0.22, 1, 0.36, 1)` easing with particle/shard/bit ingestion

The Heraclitus app currently has:
- **DurationCalcTab**: Playlist calculator with "Calculate" and "Add to Pool" actions
- **YellowPoolTab**: Already has sophisticated orb/particle/black-hole animations (could be enhanced with 2-phase paradigm)
- **SpeedBreakdownCards**: Playback velocity selection cards
- **VideoListTable**: Playlist track manifest

## Recommended Approach: Unified Kinetic Animation Layer

Create a **Tier 1/2/3/4 compliant** animation system that:
1. **Extracts the core 2-phase engine** as a reusable TypeScript module (Tier 1 Domain → Tier 3 Service)
2. **Provides React hooks** for phase orchestration (Tier 3 Service)
3. **Exports CSS keyframes/styles** as a shared stylesheet (Tier 4 Transport)
4. **Integrates at 4 strategic interaction points** in Heraclitus

### File Structure to Create/Modify

```
universe-25/src/apps/heraclitus/
├── animations/
│   ├── twoPhaseEngine.ts          # Tier 1: Core phase logic, types, easing functions
│   ├── twoPhaseStyles.css         # Tier 4: Shared CSS keyframes & utility classes
│   ├── useTwoPhase.ts             # Tier 3: React hook for phase orchestration
│   └── themes/
│       ├── chronoSpool.ts         # Amber/Gold thermal theme
│       ├── prismCrystal.ts        # Purple/Violet crystal theme
│       ├── cyberVoxel.ts          # Cyan/Neon cyber theme
│       └── supernova.ts           # Orange/White stellar theme
├── components/
│   ├── DurationCalcTab.tsx        # MODIFY: Add 2-phase on calculate & deposit
│   ├── YellowPoolTab.tsx          # MODIFY: Enhance deposit with 2-phase burst
│   ├── SpeedBreakdownCards.tsx    # MODIFY: Selection micro-animations
│   └── VideoListTable.tsx         # MODIFY: Row hover/selection feedback
├── styles/
│   └── heraclitusAnimations.css   # Tier 4: Component-specific overrides
└── index.css / App.css            # MODIFY: Import shared animation styles
```

## Integration Points

### 1. DurationCalcTab - "Calculate Duration" Button
- **Trigger**: User clicks CALCULATE
- **Phase 1**: Spool animation (0.45s) on button → shows "CALCULATING..." with kinetic spool
- **Phase 2**: On API success → smooth sink fade reveal of results dashboard
- **Theme**: Chrono Spool (Amber/Gold) - matches existing gold accent

### 2. DurationCalcTab - "Add to Pool" Button
- **Trigger**: User deposits calculated time
- **Phase 1**: Voxel compile (0.45s) on button
- **Phase 2**: Binary stream ingestion → pool vault absorb pulse
- **Theme**: Cyber Voxel (Cyan) - distinct from calculate

### 3. YellowPoolTab - Manual Deposit
- **Trigger**: User submits hours
- **Phase 1**: Prism charge on orb (0.45s)
- **Phase 2**: Crystal fracture → shard swarm ingestion into orb
- **Theme**: Prism Crystal (Purple) - distinct from existing black-hole

### 4. SpeedBreakdownCards - Speed Selection
- **Trigger**: User clicks speed card
- **Micro Phase 1**: Card compress (0.15s)
- **Micro Phase 2**: Selection glow expand (0.3s)
- **Theme**: Adaptive (uses current gold accent)

## Technical Specifications

### Core Engine (twoPhaseEngine.ts)
```typescript
// Tier 1: Pure domain logic, zero dependencies
export type Phase = 'idle' | 'spooling' | 'shattering' | 'dissolving' | 'complete';

export interface TwoPhaseConfig {
  theme: 'chrono' | 'prism' | 'cyber' | 'supernova';
  spoolDuration: number;      // default 450ms
  shatterDuration: number;    // default 1000ms
  easing: 'kinetic' | 'smooth-sink' | 'expo-out';
  onPhaseChange?: (phase: Phase) => void;
  onComplete?: () => void;
}

export interface TwoPhaseState {
  phase: Phase;
  progress: number;        // 0-1 within current phase
  spoolProgress: number;   // 0-1 during spooling
}

// Kinetic easing functions
export const kineticEase = (t: number) => Math.pow(t, 1.3);
export const smoothSinkEase = (t: number) => cubicBezier(0.22, 1, 0.36, 1)(t);
```

### React Hook (useTwoPhase.ts)
```typescript
// Tier 3: React integration
export function useTwoPhase(config: TwoPhaseConfig) {
  const [state, setState] = useState<TwoPhaseState>({ phase: 'idle', progress: 0, spoolProgress: 0 });
  const trigger = useCallback(() => { /* orchestrate phases */ }, [config]);
  const reset = useCallback(() => setState(initialState), []);
  return { state, trigger, reset };
}
```

### CSS Keyframes (twoPhaseStyles.css)
```css
/* Phase 1: Spool */
@keyframes two-phase-spool-compress { /* core scaling + glow */ }
@keyframes two-phase-spool-shake { /* screen shake */ }
@keyframes two-phase-spool-lightning { /* inward arcs */ }

/* Phase 2: Shatter/Dissolve */
@keyframes two-phase-shockwave { /* expanding rings */ }
@keyframes two-phase-smooth-sink { /* cubic-bezier(0.22, 1, 0.36, 1) downward fade */ }
@keyframes two-phase-particle-ingest { /* magnet pull to target */ }

/* Theme-specific color variables */
:root {
  --chrono-gold: #fbbf24; --chrono-amber: #f97316;
  --prism-violet: #c084fc; --prism-magenta: #d946ef;
  --cyber-cyan: #00f0ff; --cyber-teal: #5eead4;
  --supernova-orange: #fb923c; --supernova-white: #fff;
}
```

## Verification Plan

1. **TypeScript Compilation**: `npx tsc --noEmit` in universe-25
2. **Dev Server**: `npm run dev` → navigate to Heraclitus
3. **Test Scenarios**:
   - Click "CALCULATE" → observe Phase 1 spool on button, Phase 2 result reveal
   - Click "Add to Pool" → observe cyber voxel burst
   - YellowPoolTab manual deposit → observe prism crystal burst
   - Click speed cards → observe micro selection animation
   - Hover video rows → observe subtle kinetic feedback
4. **Performance**: Verify 60fps during animations, no layout thrashing
5. **Accessibility**: Respect `prefers-reduced-motion`

## Dependencies

- No new npm dependencies (pure CSS + TypeScript)
- Uses existing `lucide-react` icons
- Leverages existing `Cinzel` font for typography

## Risk Mitigation

- **Animation overload**: All animations respect `prefers-reduced-motion` media query
- **Bundle size**: CSS keyframes ~2KB gzipped; TS engine ~3KB
- **YellowPoolTab conflict**: New 2-phase deposit is additive; existing idle loop preserved
- **Theme consistency**: All 4 themes use CSS custom properties for easy theming

## Questions for Manager

1. **Default theme for Calculate**: Chrono Spool (Gold) matches current accent — confirm?
2. **YellowPoolTab**: Replace existing black-hole deposit burst with Prism Crystal, or keep both as options?
3. **Audio feedback**: The 2 Phases source includes Web Audio API chirps — include or keep silent?
4. **Persistence**: Should animation preferences (reduced motion, theme) persist in localStorage?