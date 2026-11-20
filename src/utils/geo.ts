/** Global ISO-3166 region resolver supporting HTTP headers, Intl.DisplayNames, and IANA timezones. */

const TIMEZONE_TO_REGION: Record<string, { countryCode: string; city?: string }> = {
  'Asia/Dubai': { countryCode: 'AE', city: 'Abu Dhabi' },
  'Asia/Muscat': { countryCode: 'OM', city: 'Muscat' },
  'Asia/Riyadh': { countryCode: 'SA', city: 'Riyadh' },
  'Asia/Qatar': { countryCode: 'QA', city: 'Doha' },
  'Asia/Kuwait': { countryCode: 'KW', city: 'Kuwait City' },
  'Asia/Bahrain': { countryCode: 'BH', city: 'Manama' },
  'Asia/Tokyo': { countryCode: 'JP', city: 'Tokyo' },
  'Asia/Seoul': { countryCode: 'KR', city: 'Seoul' },
  'Asia/Singapore': { countryCode: 'SG', city: 'Singapore' },
  'Asia/Kolkata': { countryCode: 'IN', city: 'Mumbai' },
  'Asia/Calcutta': { countryCode: 'IN', city: 'Mumbai' },
  'Asia/Karachi': { countryCode: 'PK', city: 'Karachi' },
  'Asia/Colombo': { countryCode: 'LK', city: 'Colombo' },
  'Asia/Bangkok': { countryCode: 'TH', city: 'Bangkok' },
  'Asia/Jakarta': { countryCode: 'ID', city: 'Jakarta' },
  'Asia/Manila': { countryCode: 'PH', city: 'Manila' },
  'Asia/Shanghai': { countryCode: 'CN', city: 'Shanghai' },
  'Asia/Hong_Kong': { countryCode: 'HK', city: 'Hong Kong' },
  'Europe/London': { countryCode: 'GB', city: 'London' },
  'Europe/Paris': { countryCode: 'FR', city: 'Paris' },
  'Europe/Berlin': { countryCode: 'DE', city: 'Berlin' },
  'Europe/Madrid': { countryCode: 'ES', city: 'Madrid' },
  'Europe/Rome': { countryCode: 'IT', city: 'Rome' },
  'Europe/Amsterdam': { countryCode: 'NL', city: 'Amsterdam' },
  'Europe/Stockholm': { countryCode: 'SE', city: 'Stockholm' },
  'Europe/Zurich': { countryCode: 'CH', city: 'Zurich' },
  'Africa/Cairo': { countryCode: 'EG', city: 'Cairo' },
  'Africa/Lagos': { countryCode: 'NG', city: 'Lagos' },
  'Africa/Nairobi': { countryCode: 'KE', city: 'Nairobi' },
  'Africa/Johannesburg': { countryCode: 'ZA', city: 'Johannesburg' },
  'America/New_York': { countryCode: 'US', city: 'New York' },
  'America/Chicago': { countryCode: 'US', city: 'Chicago' },
  'America/Denver': { countryCode: 'US', city: 'Denver' },
  'America/Los_Angeles': { countryCode: 'US', city: 'Los Angeles' },
  'America/Toronto': { countryCode: 'CA', city: 'Toronto' },
  'America/Vancouver': { countryCode: 'CA', city: 'Vancouver' },
  'America/Sao_Paulo': { countryCode: 'BR', city: 'São Paulo' },
  'America/Mexico_City': { countryCode: 'MX', city: 'Mexico City' },
  'America/Argentina/Buenos_Aires': { countryCode: 'AR', city: 'Buenos Aires' },
  'Australia/Sydney': { countryCode: 'AU', city: 'Sydney' },
  'Australia/Melbourne': { countryCode: 'AU', city: 'Melbourne' },
  'Pacific/Auckland': { countryCode: 'NZ', city: 'Auckland' }
};

/** Resolves a human-readable English country name from any 2-letter ISO country code. */
export function resolveCountryName(countryCode: string): string {
  const code = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return countryCode;
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return displayNames.of(code) || code;
  } catch {
    return code;
  }
}

/** Resolves countryCode, countryName, and city from an IANA timezone identifier (e.g. Asia/Tokyo). */
export function resolveRegionFromTimezone(timeZone?: string): {
  countryCode: string;
  countryName: string;
  city?: string;
} | null {
  if (!timeZone || typeof timeZone !== 'string') return null;
  const trimmed = timeZone.trim();
  const mapped = TIMEZONE_TO_REGION[trimmed];
  if (mapped) {
    return {
      countryCode: mapped.countryCode,
      countryName: resolveCountryName(mapped.countryCode),
      city: mapped.city
    };
  }
  return null;
}

/** Converts a 2-letter ISO code into a regional flag emoji, or globe icon globally. */
export function countryFlagEmoji(countryCode?: string): string {
  if (!countryCode || !/^[A-Za-z]{2}$/.test(countryCode.trim())) return '🌐';
  const code = countryCode.trim().toUpperCase();
  return String.fromCodePoint(...Array.from(code).map((char) => 127397 + char.charCodeAt(0)));
}

const DEPRECATED_ISO_CODES = new Set(['AN', 'BU', 'CS', 'DD', 'FX', 'NT', 'SU', 'TP', 'YD', 'YU', 'ZR']);

/** Resolves a best-effort 2-letter country code from user-typed country name or ISO code. */
export function resolveCountryCodeFromInput(countryInput: string): string {
  const trimmed = countryInput.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();

  const lower = trimmed.toLowerCase();
  if (lower.includes('emirates') || lower === 'uae' || lower.includes('abu dhabi') || lower.includes('dubai')) {
    return 'AE';
  }
  if (lower.includes('united states') || lower === 'usa') return 'US';
  if (lower.includes('united kingdom') || lower === 'uk' || lower.includes('britain')) return 'GB';

  // Check known cities in timezone mapping (e.g. Colombo -> LK, Tokyo -> JP, Sydney -> AU)
  for (const entry of Object.values(TIMEZONE_TO_REGION)) {
    if (entry.city && entry.city.toLowerCase() === lower) {
      return entry.countryCode;
    }
  }

  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    for (let i = 65; i <= 90; i++) {
      for (let j = 65; j <= 90; j++) {
        const candidate = String.fromCharCode(i, j);
        if (DEPRECATED_ISO_CODES.has(candidate)) continue;
        const name = displayNames.of(candidate);
        if (name && name.toLowerCase() === lower) {
          return candidate;
        }
      }
    }
  } catch {
    // Fallback below
  }

  return trimmed.slice(0, 2).toUpperCase() || 'GL';
}
