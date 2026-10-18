/**
 * Local Scientific Gatekeeper
 *
 * Deterministic pre-check that runs before any LLM call. It declines papers that cannot
 * produce a human routine and names the exact reason, so the user learns why.
 *
 * Matching is whole-word on a normalized title, so author names and ordinary words that
 * merely contain a keyword ("Rathleff", "inspiratory", "concentration" all contain "rat")
 * are never declined.
 */

import { COPY } from '../data/copy';

export type GatekeeperCategory = 'in-vitro' | 'animal' | 'theoretical' | 'observational';

export interface GatekeeperVerdict {
  declined: boolean;
  category?: GatekeeperCategory;
  reason?: string;
  matchedTerm?: string;
}

interface GatekeeperRule {
  category: GatekeeperCategory;
  reason: string;
  terms: string[];
}

/** Checked in order: an in-vitro study on murine cells is reported as in vitro, not animal. */
const GATEKEEPER_RULES: GatekeeperRule[] = [
  {
    category: 'in-vitro',
    reason: COPY.extraction.declinedInVitro,
    terms: [
      'in vitro',
      'cell culture',
      'cell cultures',
      'cultured cells',
      'cell line',
      'cell lines',
      'petri',
      'organoid',
      'organoids',
      'macrophage cell'
    ]
  },
  {
    category: 'animal',
    reason: COPY.extraction.declinedAnimalModel,
    terms: [
      'mouse',
      'mice',
      'murine',
      'rat',
      'rats',
      'rodent',
      'rodents',
      'wistar',
      'sprague dawley',
      'rabbit',
      'rabbits',
      'porcine',
      'canine',
      'feline',
      'bovine',
      'ovine',
      'equine',
      'zebrafish',
      'drosophila',
      'animal model',
      'animal models',
      'preclinical model'
    ]
  },
  {
    category: 'theoretical',
    reason: COPY.extraction.declinedTheoreticalScience,
    terms: [
      'quantum',
      'physics',
      'astrophysics',
      'cosmology',
      'cosmological',
      'relativity',
      'astronomy',
      'string theory',
      'gravitational',
      'thermodynamic',
      'thermodynamics',
      'particle physics',
      'topology',
      'topological',
      'anyons',
      'pure math',
      'pure mathematics',
      'macroeconomic',
      'macroeconomics',
      'monetary policy',
      'econometric',
      'econometrics'
    ]
  },
  {
    category: 'observational',
    reason: COPY.extraction.declinedObservational,
    terms: [
      'cohort study',
      'cohort studies',
      'prospective cohort',
      'retrospective cohort',
      'observational study',
      'observational studies',
      'observational',
      'cross sectional',
      'case control',
      'biobank',
      'mendelian randomization',
      'epidemiological study'
    ]
  }
];

/** Lowercases and turns separators (`_`, `-`, `.`) into spaces so file names match like titles. */
export function normalizeGatekeeperText(input: string): string {
  return input
    .toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/[_\-./]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whole-word, case-insensitive match. Multi-word terms tolerate any separator between words. */
export function containsTerm(text: string, term: string): boolean {
  const normalizedTerm = normalizeGatekeeperText(term);
  if (!normalizedTerm) return false;
  const pattern = normalizedTerm.split(' ').map(escapeRegExp).join('\\s+');
  return new RegExp(`(^|[^a-z0-9])${pattern}($|[^a-z0-9])`, 'i').test(normalizeGatekeeperText(text));
}

export function classifyPaperSource(input: string): GatekeeperVerdict {
  for (const rule of GATEKEEPER_RULES) {
    const matchedTerm = rule.terms.find((term) => containsTerm(input, term));
    if (matchedTerm) {
      return { declined: true, category: rule.category, reason: rule.reason, matchedTerm };
    }
  }
  return { declined: false };
}
