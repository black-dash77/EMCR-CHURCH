import { useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';

/**
 * Hook to prevent multiple rapid navigations
 * Adds a debounce to router.push to avoid opening the same screen multiple times
 */
export function useNavigationLock(lockDuration = 500) {
  const router = useRouter();
  const isNavigating = useRef(false);

  const navigateTo = useCallback((path: string) => {
    if (isNavigating.current) return;

    isNavigating.current = true;
    router.push(path as any);

    setTimeout(() => {
      isNavigating.current = false;
    }, lockDuration);
  }, [router, lockDuration]);

  return { navigateTo, router };
}
