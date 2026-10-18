/**
 * Canonical Research Paper Fingerprinting & Normalization
 *
 * Provides deterministic hashing and identification for scientific papers
 * across multiple users, ensuring research protocols are de-duplicated and linked
 * to a shared canonical entity in Firestore.
 */

export function normalizeDoi(doi?: string | null): string | null {
  if (!doi || typeof doi !== 'string') return null;
  const trimmed = doi.trim().toLowerCase();
  // Strip http/https url prefixes if present
  const stripped = trimmed
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .trim();

  return stripped.length > 0 ? stripped : null;
}

export function normalizeTitle(title?: string | null): string {
  if (!title || typeof title !== 'string') return 'untitled-paper';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Sanitize an identifier so it is safe for Firestore document keys (no slashes, special chars). */
export function sanitizeDocId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/** Known pre-calibrated sample protocol mappings to preserve friendly IDs */
const KNOWN_PRESET_MAP: Record<string, string> = {
  achilles: 'achilles',
  'hair-loss': 'hair-loss',
  'creatine-sleep': 'creatine-sleep',
  'zone2-cardio': 'zone2-cardio',
  'time-restricted-feeding': 'time-restricted-feeding',
  'melatonin-sleep': 'melatonin-sleep',
  'plantar-fasciitis': 'plantar-fasciitis',
  'imst-blood-pressure': 'imst-blood-pressure',
  'warm-bath-sleep': 'warm-bath-sleep',
  'cervical-posture': 'cervical-posture',
  'ashwagandha-stress': 'ashwagandha-stress',
  'dual-n-back': 'dual-n-back'
};

const KNOWN_DOI_MAP: Record<string, string> = {
  '10.1177/03635465980260030301': 'achilles',
  '10.4103/0974-7753.114700': 'hair-loss',
  '10.1038/s41598-024-54249-9': 'creatine-sleep',
  '10.1249/mss.0000000000002130': 'zone2-cardio',
  '10.1056/nejmoa2114833': 'time-restricted-feeding',
  '10.1016/j.smrv.2023.101784': 'melatonin-sleep',
  '10.1111/sms.12313': 'plantar-fasciitis',
  '10.1161/jaha.121.020982': 'imst-blood-pressure',
  '10.1016/j.smrv.2019.04.008': 'warm-bath-sleep',
  '10.1179/106698105790824888': 'cervical-posture',
  '10.4103/0253-7176.106022': 'ashwagandha-stress',
  '10.1073/pnas.0801268105': 'dual-n-back'
};

export interface PaperIdentifierInput {
  id?: string;
  doi?: string;
  title?: string;
  year?: number;
}

/**
 * Computes a deterministic canonical paper document ID.
 * Priority:
 * 1. Known preset alias
 * 2. Normalized DOI (globally unique standard in scientific publishing)
 * 3. Normalized Title + Year slug
 */
export function getCanonicalPaperId(paper: PaperIdentifierInput, fallbackId?: string): string {
  // Check preset ID
  if (fallbackId && KNOWN_PRESET_MAP[fallbackId]) {
    return KNOWN_PRESET_MAP[fallbackId];
  }
  if (paper.id && KNOWN_PRESET_MAP[paper.id]) {
    return KNOWN_PRESET_MAP[paper.id];
  }

  // Check DOI match
  const normDoi = normalizeDoi(paper.doi);
  if (normDoi) {
    if (KNOWN_DOI_MAP[normDoi]) {
      return KNOWN_DOI_MAP[normDoi];
    }
    return `doi__${sanitizeDocId(normDoi)}`;
  }

  // Fallback to title slug + year
  const slug = normalizeTitle(paper.title);
  const yearSuffix = paper.year ? `_${paper.year}` : '';
  return `paper__${slug}${yearSuffix}`;
}
