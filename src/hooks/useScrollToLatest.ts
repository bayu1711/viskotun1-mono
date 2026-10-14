import { useEffect, useRef } from 'react';
import { SCROLL_TO_LATEST_DELAY_MS } from '../data/config';

/** Scrolls the returned anchor into view whenever `trigger` changes while active. */
export function useScrollToLatest<T extends HTMLElement>(active: boolean, trigger: string | number) {
  const anchorRef = useRef<T>(null);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => {
      anchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, SCROLL_TO_LATEST_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, trigger]);

  return anchorRef;
}