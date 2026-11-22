/**
 * Validates and repairs the routine JSON that Gemini returns before it reaches users.
 *
 * Gemini output is untrusted: fields can be missing, mistyped or oversized. This schema
 * requires the parts a user follows (title and steps with an action), fills safe defaults
 * for the rest, caps text sizes, and drops unvalidated fields.
 */

import { z } from 'zod';
import type { Routine } from '../types/routine';

const MAX_TEXT = 2_000;
const MAX_EXCERPT = 6_000;

const text = (fallback = '') =>
  z.preprocess((v) => (typeof v === 'string' ? v.slice(0, MAX_TEXT) : v), z.string()).catch(fallback);
const count = (fallback: number, max: number) =>
  z.coerce.number().int().min(0).max(max).catch(fallback);

const stepSchema = z
  .object({
    id: z.string().min(1).max(80).optional(),
    action: z.string().min(1).max(200),
    detail: text(),
    sets: count(1, 50),
    reps: count(1, 500),
    frequency: text('1x Daily'),
    durationSeconds: z.coerce.number().min(0).max(24 * 3600).optional().catch(undefined),
    inferred: z.boolean().optional().catch(undefined)
  })
  .passthrough();

const listOf = <T extends z.ZodTypeAny>(item: T, max: number) =>
  z
    .array(z.unknown())
    .catch([])
    .transform((items) =>
      items
        .map((entry) => item.safeParse(entry))
        .filter((r): r is z.ZodSafeParseSuccess<z.infer<T>> => r.success)
        .map((r) => r.data)
        .slice(0, max)
    );

const idText = z.object({ id: z.string().max(80).optional() }).passthrough();

export const extractedRoutineSchema = z
  .object({
    id: z.string().max(120).optional().catch(undefined),
    title: z.string().min(1).max(300),
    shortTitle: z.string().max(120).optional().catch(undefined),
    phase: text('Phase 1'),
    phaseLabel: text('Week 1'),
    totalDays: count(28, 730),
    paper: z
      .object({
        title: text(),
        authors: text(),
        journal: text(),
        doi: text(),
        year: z.coerce.number().int().min(1900).max(2100).catch(new Date().getFullYear()),
        sampleSize: count(0, 10_000_000),
        trialType: text(),
        pages: count(0, 10_000)
      })
      .passthrough()
      .catch({
        title: '',
        authors: '',
        journal: '',
        doi: '',
        year: new Date().getFullYear(),
        sampleSize: 0,
        trialType: '',
        pages: 0
      }),
    steps: listOf(stepSchema, 30).refine((steps) => steps.length > 0, 'Routine has no usable steps'),
    progressionRules: listOf(idText, 30),
    contraindications: listOf(idText, 30),
    missingDataFlags: listOf(idText, 30),
    faqs: listOf(z.object({ question: z.string(), answer: z.string() }).passthrough(), 30),
    dataCollectionSpec: listOf(z.object({ id: z.string().min(1).max(80) }).passthrough(), 20),
    methodsExcerpt: z
      .preprocess((v) => (typeof v === 'string' ? v.slice(0, MAX_EXCERPT) : undefined), z.string().optional())
      .catch(undefined)
  })
  .passthrough();

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'extracted-routine'
  );
}

/** Empty community block: a new extraction has no participants yet, so it claims none. */
function emptyCommunity(): Routine['community'] {
  return {
    studyEfficacy: 0,
    realWorldEfficacy: 0,
    userCount: 0,
    medianAdherence: 0,
    dropOffUnit: 'day',
    peakPeriod: 0,
    dropOff: [],
    insightLead: '',
    insightRest: '',
    reviews: []
  };
}

export type RoutineValidation =
  | { ok: true; routine: Routine }
  | { ok: false; reason: string };

/**
 * Parses a raw model routine. Returns a repaired Routine, or a reason when it is unusable.
 * Step ids are made unique and present, since logging and progress are keyed by them.
 */
export function validateExtractedRoutine(raw: unknown): RoutineValidation {
  const parsed = extractedRoutineSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, reason: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
  }

  const data = parsed.data;
  const id = data.id && /^[\w.-]+$/.test(data.id) ? data.id : slugify(data.paper.title || data.title);

  const seenStepIds = new Set<string>();
  const steps = data.steps.map((step, index) => {
    let stepId = step.id && /^[\w.-]+$/.test(step.id) ? step.id : `${id}-step-${index + 1}`;
    if (seenStepIds.has(stepId)) stepId = `${stepId}-${index + 1}`;
    seenStepIds.add(stepId);
    return { ...step, id: stepId };
  });

  const routine = {
    ...data,
    id,
    shortTitle: data.shortTitle || data.title,
    steps,
    currentDay: 1,
    streak: 0,
    dayHistory: [],
    initialSetsDone: {},
    community: emptyCommunity()
  } as unknown as Routine;

  return { ok: true, routine };
}
