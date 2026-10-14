import { useEffect, useState } from 'react';
import { EXTRACTION_STAGE_MS, EXTRACTION_TICK_MS } from '../data/config';

/** Derives the current extraction stage from elapsed time since `createdAt`. */
export function useExtractionProgress(createdAt: number, stageCount: number) {
  const [now, setNow] = useState(() => Date.now());
  const stage = Math.min(Math.floor((now - createdAt) / EXTRACTION_STAGE_MS), stageCount);
  const done = stage >= stageCount;

  useEffect(() => {
    if (done) return;
    const timer = window.setInterval(() => setNow(Date.now()), EXTRACTION_TICK_MS);
    return () => window.clearInterval(timer);
  }, [done]);

  return { stage, done };
}