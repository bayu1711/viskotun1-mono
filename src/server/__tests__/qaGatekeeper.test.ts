import { describe, expect, it, vi } from 'vitest';

vi.mock('../guardrailLedger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../guardrailLedger')>();
  return { ...actual, getEffectiveGuardrails: async () => actual.BASELINE_GUARDRAIL_POLICY };
});

import { extractPaperProtocol } from '../geminiExtraction';
import { classifyPaperSource, containsTerm } from '../gatekeeper';

/** QA issue #31 · TC-07 to TC-10 AI Safety Gatekeeper Rejection Suite */
const REJECTION_CASES = [
  {
    tc: 'TC-07 preclinical animal model',
    input: 'Weight Pulling: A Novel Mouse Model of Progressive Resistance Exercise',
    category: 'animal',
    label: 'Non-human / rodent model'
  },
  {
    tc: 'TC-08 in vitro cell culture',
    input: 'Downregulation of NF-κB by Curcumin in Murine RAW 264.7 Macrophage Cell Culture',
    category: 'in-vitro',
    label: 'In vitro / cell culture study'
  },
  {
    tc: 'TC-09 theoretical physics',
    input: 'Topological Quantum Computation and Braided Anyons in Fractional Quantum Hall Liquids',
    category: 'theoretical',
    label: 'Theoretical / non-human science'
  },
  {
    tc: 'TC-10 observational cohort',
    input: 'Coffee Intake and 10-Year All-Cause Mortality in the UK Biobank: A Prospective Cohort Study',
    category: 'observational',
    label: 'Observational study lacking an executable routine'
  }
] as const;

/** Titles from TC-01 … TC-06 that must pass the gatekeeper. */
const APPROVED_TITLES = [
  'High-load strength training improves outcome in patients with plantar fasciitis: A randomized controlled trial with 12-month follow-up',
  'Rathleff 2015 plantar fasciitis',
  'Novel High-Resistance Inspiratory Muscle Strength Training Lowers Blood Pressure and Improves Vascular Endothelial Function in Healthy Midlife and Older Adults',
  'Before-bedtime passive water heating by warm shower or bath to improve sleep: A systematic review and meta-analysis',
  'Effectiveness of an Exercise Program to Improve Forward Head Posture in Normal Adults: A Randomized Controlled Trial',
  'A prospective, randomized double-blind, placebo-controlled study of safety and efficacy of a high-concentration full-spectrum extract of Ashwagandha root in reducing stress and anxiety in adults',
  'Improving fluid intelligence with training on working memory'
];

describe('QA TC-07…TC-10 · gatekeeper rejection suite', () => {
  it.each(REJECTION_CASES)('$tc is rejected with the "$label" reason', ({ input, category, label }) => {
    const verdict = classifyPaperSource(input);
    expect(verdict.declined).toBe(true);
    expect(verdict.category).toBe(category);
    expect(verdict.reason).toContain(label);
  });

  it.each(REJECTION_CASES)('$tc returns no routine from the extraction pipeline', async ({ input, label }) => {
    const result = await extractPaperProtocol({ text: input });
    expect(result.eligible).toBe(false);
    expect(result.rejectionReason).toContain(label);
    expect(result.routine).toBeUndefined();
    expect(result.protocol).toBeUndefined();
  });
});

describe('gatekeeper whole-word matching', () => {
  it.each(APPROVED_TITLES)('does not decline "%s"', (title) => {
    expect(classifyPaperSource(title).declined).toBe(false);
  });

  it('ignores keywords hidden inside other words', () => {
    expect(containsTerm('Rathleff', 'rat')).toBe(false);
    expect(containsTerm('Inspiratory muscle training', 'rat')).toBe(false);
    expect(containsTerm('High-concentration extract', 'rat')).toBe(false);
    expect(containsTerm('Wistar Rat Achilles Model', 'rat')).toBe(true);
  });

  it('matches keywords in underscore or hyphen file names', () => {
    expect(classifyPaperSource('Aging_Mouse_Models.pdf').category).toBe('animal');
    expect(classifyPaperSource('in-vitro_tenocyte_study.pdf').category).toBe('in-vitro');
  });
});
