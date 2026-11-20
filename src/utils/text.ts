/**
 * UI Defensive Text Normalization Utilities
 *
 * Ensures user-facing text, extracted paper metadata, phase tags, and labels
 * are consistently formatted in clean Sentence Case / Title Case even when
 * underlying data sources or extraction models yield raw lowercase strings.
 */

/**
 * Capitalizes a single word, respecting hyphenated compounds (e.g. "n-back" -> "N-Back")
 * and preserving existing acronyms / uppercase terms (e.g. "IMST", "RCT", "N1", "12RM").
 */
export function capitalizeWord(word: string): string {
  if (!word) return '';

  // Handle hyphenated words like "n-back" -> "N-Back"
  if (word.includes('-')) {
    return word
      .split('-')
      .map((part) => capitalizeWord(part))
      .join('-');
  }

  // Preserve existing full acronyms (>= 2 chars all caps, e.g. "IMST", "RCT")
  if (word.length >= 2 && word === word.toUpperCase() && /[A-Z]/.test(word)) {
    return word;
  }

  // Preserve mixed acronym-number combinations like "12RM" or "3s"
  if (/^\d+[A-Z]+$/.test(word)) {
    return word;
  }

  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Converts a string to Title Case.
 * Example: "achilles rehab" -> "Achilles Rehab", "week 1" -> "Week 1", "dual n-back" -> "Dual N-Back"
 */
export function toTitleCase(text?: string | null): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  return trimmed
    .split(/\s+/)
    .map((word) => capitalizeWord(word))
    .join(' ');
}

/**
 * Converts a string to Sentence case (capitalizing only the first character).
 * Example: "active recovery" -> "Active recovery", "week 1" -> "Week 1"
 */
export function toSentenceCase(text?: string | null): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Defensively normalizes a routine title or short title for presentation in the UI.
 * Handles cases like "achilles rehab" -> "Achilles Rehab", "hair regrowth" -> "Hair Regrowth".
 */
export function formatRoutineTitle(title?: string | null): string {
  if (!title) return '';
  return toTitleCase(title);
}

/**
 * Defensively normalizes a phase label for presentation in the UI.
 * Handles cases like "week 1" -> "Week 1", "day 1" -> "Day 1", "loading" -> "Loading".
 */
export function formatPhaseLabel(phaseLabel?: string | null): string {
  if (!phaseLabel) return '';
  return toTitleCase(phaseLabel);
}

/**
 * Defensively normalizes step stat labels for presentation in the UI.
 * Handles cases like "dose:" -> "Dose:", "tempo:" -> "Tempo:", "Hold:" -> "Hold:".
 */
export function formatStatLabel(label?: string | null): string {
  if (!label) return '';
  const trimmed = label.trim();
  if (!trimmed) return '';

  return capitalizeWord(trimmed);
}
