// Lightweight fetch for the social-proof measurement counter.
//
// The entry screen and the landing pages only need one number, so they hit the
// RPC endpoint directly instead of pulling the whole Supabase client into the
// entry chunk. The build-time snapshot is rendered immediately so the number is
// visible on the first frame and never jumps in from nothing.

import { ALL_TIME_TOTAL } from '@/content/facts';

export const FALLBACK_MEASUREMENT_COUNT = ALL_TIME_TOTAL;

const URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/get_measurement_count`;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export async function fetchMeasurementCount(signal?: AbortSignal): Promise<number | null> {
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
      signal,
    });
    if (!res.ok) return null;
    const value = Number(await res.json());
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}
