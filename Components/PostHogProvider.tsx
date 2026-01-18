"use client";

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { initPostHog, trackPageView, identifyUser } from '../lib/analytics';

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      const url = searchParams ? `${pathname}?${searchParams}` : pathname;
      trackPageView(url);
    }
  }, [pathname, searchParams]);

  return null;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Initialize PostHog on mount
  useEffect(() => {
    initPostHog();
  }, []);

  // Identify user when authenticated (for existing users)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Identify user in PostHog
        identifyUser(user.uid, {
          email: user.email,
          name: user.displayName,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  );
}
