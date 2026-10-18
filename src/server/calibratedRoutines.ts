/**
 * Lookup for pre-calibrated reference papers.
 *
 * A pasted DOI, title, or the calibrated PDF file name resolves to a fixed routine, so these
 * papers skip LLM extraction and always produce the same steps, widgets and safety rules.
 */

import { calibratedRoutines } from '../data/routines/calibrated';
import type { Routine } from '../types/routine';
import { normalizeDoi } from '../utils/paperFingerprint';

/** Title variants seen in citations (publisher title, common rewordings). Normalized at load. */
const TITLE_ALIASES: Record<string, string[]> = {
  'plantar-fasciitis': ['high load strength training improves outcome in patients with plantar fasciitis'],
  'imst-blood-pressure': ['novel high resistance inspiratory muscle strength training lowers blood pressure'],
  'warm-bath-sleep': [
    'before bedtime passive body heating by warm shower or bath to improve sleep',
    'before bedtime passive water heating by warm shower or bath to improve sleep'
  ],
  'cervical-posture': ['effectiveness of an exercise program to improve forward head posture in normal adults'],
  'ashwagandha-stress': [
    'study of safety and efficacy of a high concentration full spectrum extract of ashwagandha root in reducing stress and anxiety'
  ],
  'dual-n-back': ['improving fluid intelligence with training on working memory']
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\.pdf$/i, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Pulls a DOI out of free text or a doi.org link. */
function extractDoi(source: string): string | null {
  const match = source.match(/10\.\d{4,9}\/[^\s"<>]+/i);
  return match ? normalizeDoi(match[0].replace(/[.,;)]+$/, '')) : null;
}

export function findCalibratedRoutine(source: string): Routine | null {
  if (!source) return null;

  const doi = extractDoi(source);
  if (doi) {
    const byDoi = calibratedRoutines.find((routine) => normalizeDoi(routine.paper.doi) === doi);
    if (byDoi) return byDoi;
  }

  const text = normalizeText(source);
  if (!text) return null;

  return (
    calibratedRoutines.find((routine) => {
      const candidates = [
        ...(TITLE_ALIASES[routine.id] ?? []),
        routine.paper.title.split(':')[0],
        routine.paper.fileName
      ].map(normalizeText);
      return candidates.some((candidate) => candidate.length > 0 && text.includes(candidate));
    }) ?? null
  );
}
