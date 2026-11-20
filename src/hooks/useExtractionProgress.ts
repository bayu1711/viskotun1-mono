import { useEffect, useState } from 'react';
import { EXTRACTION_STAGE_MS, EXTRACTION_TICK_MS } from '../data/config';

/** Derives the current extraction stage from elapsed time since `createdAt`. */
export function useExtractionProgress(createdAt: number, stageCount: number) {
  const [now, setNow] = useState(() => Date.now());
  const elapsedMs = Math.max(0, now - createdAt);
  const stage = Math.min(Math.floor(elapsedMs / EXTRACTION_STAGE_MS), stageCount);
  const done = stage >= stageCount;

  // Keep ticking after the last stage (slower) so callers can react to a long wait.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), done ? 1000 : EXTRACTION_TICK_MS);
    return () => window.clearInterval(timer);
  }, [done]);

  return { stage, done, elapsedMs };
}