// path: src/apps/vinyl-angel/components/LoadingDiagnostics.tsx
// Explains WHY the player is waiting: current phase, elapsed time, in-flight backend calls, last call latency.

import React, { useEffect, useState } from 'react';
import { getApiActivity, subscribeApiActivity } from '../../../core/api';
import type { ApiActivity } from '../../../core/api';

interface LoadingDiagnosticsProps {
  active: boolean;
  phase?: string;
}

const SLOW_CALL_MS = 1500;
const HINT_AFTER_MS = 4000;

export const LoadingDiagnostics: React.FC<LoadingDiagnosticsProps> = ({ active, phase }) => {
  const [activity, setActivity] = useState<ApiActivity>(getApiActivity());
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => subscribeApiActivity(setActivity), []);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    setElapsed(0);
    const id = setInterval(() => setElapsed(Date.now() - start), 250);
    return () => clearInterval(id);
  }, [active]);

  const now = performance.now();
  const inFlight = activity.inFlight.map((e) => ({ label: e.label, age: Math.round(now - e.startedAt) }));
  const slowInFlight = inFlight.some((e) => e.age > SLOW_CALL_MS);
  const slowLast = (activity.lastMs ?? 0) > SLOW_CALL_MS;
  const seconds = (elapsed / 1000).toFixed(1);

  let hint: string | null = null;
  if (elapsed > HINT_AFTER_MS) {
    if (slowInFlight || slowLast) {
      hint = 'Backend calls are slow. Check that the storage server is not busy, reloading or blocked.';
    } else if (inFlight.length === 0) {
      hint = 'No backend request is pending: the player is working locally (auto-switch / buffering).';
    }
  }

  return (
    <div className="space-y-1 text-[11px] font-mono text-[#8c7a9e] max-w-sm">
      {phase && <p className="text-[#cbd5e1]">{phase}</p>}
      <p>
        ⏱ {seconds}s
        {inFlight.length > 0 && (
          <span>
            {' '}• waiting on{' '}
            {inFlight
              .slice(0, 3)
              .map((e) => `${e.label} (${(e.age / 1000).toFixed(1)}s)`)
              .join(', ')}
            {inFlight.length > 3 ? ` +${inFlight.length - 3} more` : ''}
          </span>
        )}
      </p>
      {activity.lastLabel && (
        <p className={slowLast ? 'text-amber-400' : undefined}>
          last call: {activity.lastLabel} took {activity.lastMs} ms
        </p>
      )}
      {hint && <p className="text-amber-300">{hint}</p>}
    </div>
  );
};

export default LoadingDiagnostics;
