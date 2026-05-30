// Persist current 3D answers across a browser jump (in-app WKWebView → Safari).
//
// IMPORTANT: localStorage is NOT shared between WKWebView (Twitter/IG/FB) and
// Safari on iOS — they live in different storage partitions. So the URL is the
// only reliable transport across the jump. We use localStorage as a *secondary*
// fallback for same-browser refresh cases.

import type { DecisionState, UserContext, Option, Scores } from '@/types/decision';

const KEY = '3d:pending_result';
const TTL_MS = 10 * 60 * 1000; // 10 minutes

type StateSlice = Pick<DecisionState, 'context' | 'currentOption' | 'comparisonOption'>;

interface Stored {
  state: StateSlice;
  ts: number;
}

// ────────────────────────────────────────────────────────────────────────────
// localStorage (same-browser fallback)
// ────────────────────────────────────────────────────────────────────────────

export function savePendingResult(state: StateSlice): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ state, ts: Date.now() } satisfies Stored));
  } catch {
    // private mode / quota — ignore
  }
}

export function loadPendingResult(): StateSlice | null {
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

// ────────────────────────────────────────────────────────────────────────────
// URL encode / decode (cross-browser transport for the WKWebView → Safari jump)
// ────────────────────────────────────────────────────────────────────────────

const VALID_CONTEXTS: UserContext[] = ['improve', 'change', 'compare', 'burnout', 'check'];

function clampScore(n: unknown): number | null {
  const v = typeof n === 'string' ? parseInt(n, 10) : typeof n === 'number' ? n : NaN;
  if (!Number.isFinite(v)) return null;
  return Math.min(10, Math.max(1, Math.round(v)));
}

/**
 * Append the current 3D state to a URL's query string. Compact param names
 * keep the URL under ~250 chars even with names and comments.
 *
 * Schema:
 *   ctx   = UserContext
 *   d/de/di     = current scores (dinero/desarrollo/diversion)
 *   dc/dec/dic  = comparison scores
 *   n / nc      = current name / comparison name
 *   c / cc      = current comment / comparison comment
 */
export function encodeStateToParams(
  url: URL,
  state: StateSlice,
): void {
  if (state.context) url.searchParams.set('ctx', state.context);

  const cur = state.currentOption;
  if (cur) {
    url.searchParams.set('d', String(cur.scores.dinero));
    url.searchParams.set('de', String(cur.scores.desarrollo));
    url.searchParams.set('di', String(cur.scores.diversion));
    if (cur.name) url.searchParams.set('n', cur.name);
    if (cur.comment) url.searchParams.set('c', cur.comment);
  }

  const cmp = state.comparisonOption;
  if (cmp) {
    url.searchParams.set('dc', String(cmp.scores.dinero));
    url.searchParams.set('dec', String(cmp.scores.desarrollo));
    url.searchParams.set('dic', String(cmp.scores.diversion));
    if (cmp.name) url.searchParams.set('nc', cmp.name);
    if (cmp.comment) url.searchParams.set('cc', cmp.comment);
  }
}

/**
 * Reconstruct a state slice from URL search params. Returns null if required
 * fields (context + current scores) are missing or invalid.
 */
export function decodeStateFromParams(params: URLSearchParams): StateSlice | null {
  const ctx = params.get('ctx');
  if (!ctx || !VALID_CONTEXTS.includes(ctx as UserContext)) return null;

  const d = clampScore(params.get('d'));
  const de = clampScore(params.get('de'));
  const di = clampScore(params.get('di'));
  if (d === null || de === null || di === null) return null;

  const currentOption: Option = {
    name: (params.get('n') || 'Situación actual').slice(0, 100),
    scores: { dinero: d, desarrollo: de, diversion: di } satisfies Scores,
    comment: params.get('c')?.slice(0, 500) || undefined,
  };

  let comparisonOption: Option | null = null;
  const dc = clampScore(params.get('dc'));
  const dec = clampScore(params.get('dec'));
  const dic = clampScore(params.get('dic'));
  if (dc !== null && dec !== null && dic !== null) {
    comparisonOption = {
      name: (params.get('nc') || 'Otra opción').slice(0, 100),
      scores: { dinero: dc, desarrollo: dec, diversion: dic } satisfies Scores,
      comment: params.get('cc')?.slice(0, 500) || undefined,
    };
  }

  return {
    context: ctx as UserContext,
    currentOption,
    comparisonOption,
  };
}
