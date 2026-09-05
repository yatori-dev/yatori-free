import { useEffect, useMemo, useState } from 'react';

export function useSignMonitorCountdown(expiresAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);
  return useMemo(() => {
    const remainingMs = expiresAt ? Math.max(0, expiresAt - now) : 0;
    return { remainingMs, started: remainingMs > 0 };
  }, [expiresAt, now]);
}
