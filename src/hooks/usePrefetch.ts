import { useEffect } from 'react';

/**
 * Hook to prefetch the next screen's component in the flow.
 * Uses dynamic import to preload the module without rendering it.
 */
export function usePrefetchResultScreen() {
  useEffect(() => {
    // Prefetch ResultScreen after a short delay to not block initial render
    const timer = setTimeout(() => {
      import('@/components/decision/ResultScreen');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
}

/**
 * Prefetch InputScreen when user is on ContextScreen
 */
export function usePrefetchInputScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      import('@/components/decision/InputScreen');
    }, 500);

    return () => clearTimeout(timer);
  }, []);
}

/**
 * Warm InputScreen the moment the user presses down on an option, so the module
 * is in flight before the click event fires. Idempotent — the browser dedupes
 * the module request.
 */
export function prefetchInputScreen() {
  import('@/components/decision/InputScreen');
}

/**
 * Prefetch ContextScreen when user is on EntryScreen
 */
export function usePrefetchContextScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      import('@/components/decision/ContextScreen');
    }, 500);

    return () => clearTimeout(timer);
  }, []);
}
