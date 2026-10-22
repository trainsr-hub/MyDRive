// path: src/apps/heraclitus/animations/themes/chronoSpool.ts
// Theme configuration for Chrono Spool (Amber/Gold thermal blast)

import type { TwoPhaseConfig } from '../twoPhaseEngine';

/**
 * Chrono Spool Theme Configuration
 * Matches phase_005_spool_and_shatter.html from System Design Sandbox
 * Thermal Blast → Downward Dissolve
 */
export const CHRONO_SPOOL_CONFIG: TwoPhaseConfig = {
  theme: 'chrono',
  spoolDuration: 450,   // Matches source ~0.45s spool
  shatterDuration: 1000, // Matches source shatter duration
  dissolveDuration: 1000, // Matches source smooth sink fade
  easing: 'kinetic',     // Math.pow(t, 1.3) for rapid non-linear spool
};