'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * GlobalPrefetcher handles background pre-loading of main application routes 
 * and data to ensure a "zero-loading" feel.
 */
export default function GlobalPrefetcher({ isAuthenticated }: { isAuthenticated: boolean | null }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Prefetch Next.js page bundles
    const mainRoutes = ['/feed', '/chat', '/my-school', '/settings', '/search'];
    mainRoutes.forEach(route => {
      router.prefetch(route);
    });

    // 2. Background data pre-fetch (warming up the browser cache)
    // We only do this for critical data-heavy routes.
    const warmUpCache = async () => {
      try {
        // Feed Cache Warmup
        const feedParams = new URLSearchParams({ limit: '40', t: Date.now().toString() });
        fetch(`/api/feed?${feedParams}`, { priority: 'low' }).catch(() => {});
        
        // Note: For Chat, we don't fetch all messages, just warm up the socket/list
        // The Chat list is already fetched by GlobalChatListener or ChatRoom list.
      } catch (err) {
        console.warn('[Prefetch] Data warmup failed:', err);
      }
    };

    // Delay slightly to give priority to the current page's main assets
    const timeout = setTimeout(warmUpCache, 2000);
    return () => clearTimeout(timeout);
  }, [isAuthenticated, router]);

  return null;
}
