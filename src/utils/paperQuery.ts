import type { SamplePaper } from '../data/samplePapers';
import type { UserLifestyleProfile } from '../types/auth';

const URL_STOP_WORDS = new Set([
  'http',
  'https',
  'www',
  'com',
  'org',
  'gov',
  'edu',
  'net',
  'io',
  'co',
  'uk',
  'html',
  'htm',
  'php',
  'asp',
  'aspx',
  'jsp',
  'article',
  'articles',
  'index',
  'view',
  'full',
  'content',
  'post',
  'posts',
  'blog',
  'news',
  'item',
  'en',
  'wiki',
  'search',
  'term',
  'query',
  'url',
  'doi',
  'pmid',
  'pmc',
  'default',
  'home',
  'page',
  'pages',
  'site'
]);

const QUESTION_PREFIX_REGEX =
  /^(?:i\s*(?:am|'m)?\s*looking\s*for|looking\s*for|find\s*(?:me)?|can\s*you\s*find|do\s*you\s*have\s*(?:anything|any|a)?(?:\s+for)?|what\s*routines?\s*(?:are\s*there\s*for|do\s*you\s*have\s*for)?|search\s*(?:for)?|help\s*me\s*find|show\s*me|tell\s*me\s*about|how\s*about)\s+/i;

/**
 * Extracts a meaningful topic or health goal query from an unrecognized link or user text.
 */
export function extractQueryFromInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let text = input.trim();
  try {
    text = decodeURIComponent(text);
  } catch {
    // Keep raw text if invalid URI encoding
  }

  // Check if input is a URL
  const isUrl = /^https?:\/\//i.test(text) || text.includes('www.') || (text.includes('/') && text.includes('.'));

  if (isUrl) {
    try {
      const urlObj = new URL(text.startsWith('http') ? text : `https://${text}`);
      // Check query params for search terms (e.g. ?q=, ?term=, ?query=, ?s=)
      const searchParam =
        urlObj.searchParams.get('q') ||
        urlObj.searchParams.get('term') ||
        urlObj.searchParams.get('query') ||
        urlObj.searchParams.get('s');

      if (searchParam && searchParam.trim().length > 1) {
        return searchParam.replace(/[+_]/g, ' ').trim();
      }

      // Extract from pathname slugs
      const pathSegments = urlObj.pathname
        .replace(/\.[a-z0-9]+$/i, '') // strip extension
        .split(/[/\\_-]+/)
        .map((s) => s.toLowerCase().trim())
        .filter((s) => s.length > 2 && !URL_STOP_WORDS.has(s) && !/^\d+$/.test(s));

      if (pathSegments.length > 0) {
        return pathSegments.slice(0, 5).join(' ');
      }
    } catch {
      // Fallback regex parsing if URL construction fails
      const cleaned = text
        .replace(/^https?:\/\/[^/]+/i, '')
        .replace(/\.[a-z0-9]+$/i, '')
        .split(/[^a-zA-Z0-9]+/)
        .map((s) => s.toLowerCase().trim())
        .filter((s) => s.length > 2 && !URL_STOP_WORDS.has(s) && !/^\d+$/.test(s));

      if (cleaned.length > 0) {
        return cleaned.slice(0, 5).join(' ');
      }
    }
  }

  // Handle plain text
  const stripped = text.replace(QUESTION_PREFIX_REGEX, '').replace(/[?.,!;:()]+/g, ' ').trim();
  return stripped;
}

/**
 * Matches community available routine papers against a user query.
 * Always excludes guardrail rejection test fixtures.
 */
export function matchCommunityPapers(query: string, papers: SamplePaper[] = []): SamplePaper[] {
  const eligible = papers.filter((p) => !p.isGuardrailRejectionTest);
  const trimmed = query ? query.toLowerCase().trim() : '';

  if (!trimmed) {
    // Return top community papers sorted by popularity or trending rank
    return [...eligible].sort((a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0));
  }

  const queryTokens = trimmed
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);

  if (queryTokens.length === 0) {
    return [...eligible].sort((a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0));
  }

  const scored = eligible.map((paper) => {
    let score = 0;
    const shortTitle = (paper.shortTitle || '').toLowerCase();
    const title = (paper.title || '').toLowerCase();
    const domain = (paper.domain || '').toLowerCase();
    const category = (paper.category || '').toLowerCase();
    const summary = (paper.summary || '').toLowerCase();
    const features = (paper.featuresTested || []).map((f) => f.toLowerCase()).join(' ');

    // Exact phrase match gets huge boost
    if (shortTitle.includes(trimmed)) score += 50;
    if (title.includes(trimmed)) score += 40;
    if (domain.includes(trimmed) || category.includes(trimmed)) score += 30;
    if (summary.includes(trimmed)) score += 20;

    // Token-by-token scoring
    for (const token of queryTokens) {
      if (shortTitle.includes(token)) score += 15;
      if (title.includes(token)) score += 10;
      if (domain.includes(token) || category.includes(token)) score += 8;
      if (features.includes(token)) score += 6;
      if (summary.includes(token)) score += 4;
    }

    // Synonym & related term expansions
    if (
      (trimmed.includes('knee') || trimmed.includes('heel') || trimmed.includes('tendon') || trimmed.includes('foot') || trimmed.includes('leg')) &&
      paper.id.includes('achilles')
    ) {
      score += 25;
    }
    if (
      (trimmed.includes('hair') || trimmed.includes('bald') || trimmed.includes('scalp') || trimmed.includes('alopecia') || trimmed.includes('minoxidil')) &&
      paper.id.includes('hair')
    ) {
      score += 25;
    }
    if (
      (trimmed.includes('sleep') || trimmed.includes('tired') || trimmed.includes('fatigue') || trimmed.includes('creatine') || trimmed.includes('nootropic') || trimmed.includes('energy')) &&
      paper.id.includes('creatine')
    ) {
      score += 25;
    }
    if (
      (trimmed.includes('fasting') || trimmed.includes('diet') || trimmed.includes('eating') || trimmed.includes('glucose') || trimmed.includes('metabolic') || trimmed.includes('weight')) &&
      (paper.id.includes('restricted') || paper.id.includes('ramadan'))
    ) {
      score += 25;
    }
    if (
      (trimmed.includes('light') || trimmed.includes('circadian') || trimmed.includes('sun') || trimmed.includes('wake') || trimmed.includes('morning')) &&
      (paper.id.includes('circadian') || paper.id.includes('light'))
    ) {
      score += 25;
    }
    if (
      (trimmed.includes('smoke') || trimmed.includes('smoking') || trimmed.includes('nicotine') || trimmed.includes('habit') || trimmed.includes('craving') || trimmed.includes('midwakh') || trimmed.includes('dokha') || trimmed.includes('tobacco')) &&
      paper.id.includes('midwakh')
    ) {
      score += 25;
    }
    if (
      (trimmed.includes('heat') || trimmed.includes('summer') || trimmed.includes('hydration') || trimmed.includes('ambient') || trimmed.includes('hot') || trimmed.includes('climate')) &&
      paper.id.includes('heat')
    ) {
      score += 35;
    }
    if (
      (trimmed.includes('shift') || trimmed.includes('night') || trimmed.includes('desk') || trimmed.includes('sedentary')) &&
      (paper.id.includes('creatine') || paper.id.includes('circadian'))
    ) {
      score += 25;
    }
    if (
      (trimmed.includes('joint') || trimmed.includes('low-impact') || trimmed.includes('low impact') || trimmed.includes('rehab')) &&
      paper.id.includes('achilles')
    ) {
      score += 25;
    }

    return { paper, score };
  });

  const matching = scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score);

  if (matching.length > 0) {
    return matching.map((item) => item.paper);
  }

  // Fallback to top community papers if no direct keyword matched
  return [...eligible].sort((a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0));
}

export interface ExternalSearchLinks {
  pubmed: string;
  europePmc: string;
  googleScholar: string;
  clinicalTrials: string;
}

/**
 * Builds pre-filtered external search links for peer-reviewed human research databases.
 */
export function buildExternalSearchLinks(query: string): ExternalSearchLinks {
  const cleanTerm = query ? query.trim() : 'human clinical trial';

  // PubMed with clinical trial & RCT filter
  const pubmedFilter = encodeURIComponent(`${cleanTerm} (clinical trial[Filter] OR randomized controlled trial[Filter])`);
  const pubmed = `https://pubmed.ncbi.nlm.nih.gov/?term=${pubmedFilter}`;

  // Europe PMC with Open Access filter
  const europePmcFilter = encodeURIComponent(`${cleanTerm} AND OPEN_ACCESS:y`);
  const europePmc = `https://europepmc.org/search?query=${europePmcFilter}`;

  // Google Scholar with trial emphasis
  const scholarFilter = encodeURIComponent(`${cleanTerm} "clinical trial" OR "randomized controlled trial"`);
  const googleScholar = `https://scholar.google.com/scholar?q=${scholarFilter}`;

  // ClinicalTrials.gov
  const ctFilter = encodeURIComponent(cleanTerm);
  const clinicalTrials = `https://clinicaltrials.gov/search?term=${ctFilter}`;

  return { pubmed, europePmc, googleScholar, clinicalTrials };
}

export type LifestyleMatchReasonKey =
  | 'summer_heat'
  | 'ramadan_fasting'
  | 'intermittent_fasting'
  | 'smoking'
  | 'shift_work'
  | 'desk_sedentary'
  | 'circadian'
  | 'physical_caution'
  | 'popular';

export interface LifestylePresetMatch {
  paper: SamplePaper;
  score: number;
  reasonKey: LifestyleMatchReasonKey;
}

const HOT_CLIMATE_COUNTRIES = new Set(['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'EG', 'IQ']);

/**
 * Ranks pre-calibrated community routine presets against the user's saved UserLifestyleProfile
 * so new users immediately see tailored routine suggestions after completing lifestyle questions.
 */
export function getLifestyleMatchedPresets(
  lifestyleProfile?: Partial<UserLifestyleProfile>,
  papers: SamplePaper[] = [],
  limit = 3
): LifestylePresetMatch[] {
  const eligible = papers.filter((p) => !p.isGuardrailRejectionTest && Boolean(p.routineId));
  if (eligible.length === 0) return [];

  const countryCode = (lifestyleProfile?.region?.countryCode || '').toUpperCase();
  const rhythms = new Set(lifestyleProfile?.culturalRhythms ?? []);
  const cautionsText = (lifestyleProfile?.physicalCautions ?? []).join(' ').toLowerCase();
  const tagsText = (lifestyleProfile?.activeTags ?? []).join(' ').toLowerCase();
  const workPattern = lifestyleProfile?.workPattern;
  const activityBaseline = lifestyleProfile?.activityBaseline;
  const climate = lifestyleProfile?.climateSensitivity;
  const smoking = lifestyleProfile?.smokingStatus;
  const isRamadan = Boolean(lifestyleProfile?.isRamadanFastingObserver || rhythms.has('ramadan_fasting'));
  const isFasting = rhythms.has('intermittent_fasting') || tagsText.includes('fasting');
  const isHotClimate =
    climate === 'summer_heat' ||
    HOT_CLIMATE_COUNTRIES.has(countryCode) ||
    tagsText.includes('heat') ||
    tagsText.includes('summer');
  const isSmoker =
    Boolean(smoking && smoking !== 'non_smoker' && smoking !== 'former_smoker') ||
    tagsText.includes('midwakh') ||
    tagsText.includes('dokha') ||
    tagsText.includes('smok') ||
    tagsText.includes('shisha') ||
    tagsText.includes('vape');
  const isShiftWork =
    workPattern === 'shift_work' ||
    rhythms.has('late_family_dinner') ||
    tagsText.includes('shift') ||
    tagsText.includes('night');
  const isDeskSedentary =
    workPattern === 'desk_sedentary' ||
    activityBaseline === 'sedentary' ||
    tagsText.includes('desk') ||
    tagsText.includes('sedentary');
  const hasJointCaution =
    /knee|ankle|heel|achilles|tendon|joint|foot|back|rehab|pain/.test(cautionsText) ||
    /knee|ankle|heel|achilles|tendon|joint/.test(tagsText) ||
    activityBaseline === 'active';
  const isCircadianFocus =
    climate === 'cold_climate' ||
    rhythms.has('early_dawn_riser') ||
    tagsText.includes('sleep') ||
    tagsText.includes('circadian');

  const scored: LifestylePresetMatch[] = eligible.map((paper) => {
    let score = 0;
    let reasonKey: LifestyleMatchReasonKey = 'popular';
    const id = paper.id.toLowerCase();

    const applyBoost = (points: number, reason: LifestyleMatchReasonKey) => {
      if (points > score) {
        reasonKey = reason;
      }
      score += points;
    };

    if (isRamadan && id.includes('ramadan')) {
      applyBoost(55, 'ramadan_fasting');
    } else if (isFasting && (id.includes('ramadan') || id.includes('restricted'))) {
      applyBoost(40, 'intermittent_fasting');
    }

    if (isSmoker && id.includes('midwakh')) {
      applyBoost(55, 'smoking');
    }

    if (isHotClimate && id.includes('heat')) {
      applyBoost(50, 'summer_heat');
    }

    if (hasJointCaution && id.includes('achilles')) {
      applyBoost(45, 'physical_caution');
    }

    if (isShiftWork) {
      if (id.includes('creatine')) {
        applyBoost(50, 'shift_work');
      } else if (id.includes('circadian') || id.includes('light')) {
        applyBoost(35, 'shift_work');
      }
    }

    if (isDeskSedentary) {
      if (id.includes('creatine')) {
        applyBoost(40, 'desk_sedentary');
      } else if (id.includes('heat')) {
        applyBoost(25, 'desk_sedentary');
      }
    }

    if (isCircadianFocus && (id.includes('circadian') || id.includes('light') || id.includes('creatine'))) {
      applyBoost(30, 'circadian');
    }

    return { paper, score, reasonKey };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.paper.popularityScore ?? 0) - (a.paper.popularityScore ?? 0);
  });

  return scored.slice(0, limit);
}
