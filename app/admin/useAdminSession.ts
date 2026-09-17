'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * Sends anyone without a session to the login page and reports whether that
 * check is still running. Row level security would refuse the writes anyway;
 * this just avoids showing an unusable screen.
 */
export function useAdminSession(onReady?: () => Promise<void> | void) {
  // Starts false when there is no client to ask: that case renders the
  // "not configured" screen without ever consulting this flag.
  const [checking, setChecking] = useState(Boolean(supabase));
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      if (!data.session) {
        router.replace('/admin/login');
        return;
      }
      await onReady?.();
      if (alive) setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/admin/login');
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
    // `onReady` is expected to be a useCallback; re-running on a new identity is
    // the point, since that is how a caller reloads its data.
  }, [onReady, router]);

  return checking;
}
