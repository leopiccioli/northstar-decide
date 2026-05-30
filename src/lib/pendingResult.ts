// Persist the current 3D answers across a browser-jump (e.g. when the user
// taps "Abrir en Safari" from an in-app browser). TTL keeps it disposable.

import type { DecisionState } from '@/types/decision';

const KEY = '3d:pending_result';
const TTL_MS = 10 * 60 * 1000; // 10 minutes

interface Stored {
  state: Pick<DecisionState, 'context' | 'currentOption' | 'comparisonOption'>;
  ts: number;
}

export function savePendingResult(
  state: Pick<DecisionState, 'context' | 'currentOption' | 'comparisonOption'>,
): void {
  try {
    const payload: Stored = { state, ts: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // localStorage unavailable (private mode, quota) — silently skip
  }
}

export function loadPendingResult():
  | Pick<DecisionState, 'context' | 'currentOption' | 'comparisonOption'>
  | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed?.ts || Date.now() - parsed.ts > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    if (!parsed.state?.currentOption || !parsed.state?.context) return null;
    return parsed.state;
  } catch {
    return null;
  }
}

export function clearPendingResult(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // noop
  }
}
