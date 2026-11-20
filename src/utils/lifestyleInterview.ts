import type {
  CulturalRhythmId,
  RegionContext,
  RegionalLifestyleTag,
  SmokingStatus,
  UserLifestyleProfile,
  UserProfile,
  WorkPattern
} from '../types/auth';
import type { AvailabilityMode, AvailableTimeWindow } from '../types/schedule';
import type { LocaleCopy } from '../data/locales/types';
import { resolveCountryCodeFromInput, resolveCountryName } from './geo';
import { formatLifestyleTagLabel } from './lifestyleTags';
import {
  deriveClinicalFocus,
  getRegionalAvailabilityPresets,
  isFastingContextRegion,
  resolveCulturalRhythms,
  sanitizeAge,
  syncLifestyleActiveTags
} from './profile';
import {
  formatAvailabilitySummary,
  formatMinutesToTime,
  formatWindowRange,
  inferWindowLabel,
  normalizeAvailableWindows
} from './schedule';

export type LifestyleInterviewStage =
  | 'region'
  | 'age'
  | 'availability'
  | 'age_time'
  | 'rhythm'
  | 'cautions'
  | 'complete';

export const INTERVIEW_STAGE_ORDER: readonly Exclude<
  LifestyleInterviewStage,
  'complete' | 'age_time'
>[] = ['region', 'age', 'availability', 'rhythm', 'cautions'];

interface CityPreset {
  city: string;
  countryCode: string;
  countryName: string;
  aliases?: string[];
}

const KNOWN_CITIES: readonly CityPreset[] = [
  { city: 'Abu Dhabi', countryCode: 'AE', countryName: 'United Arab Emirates', aliases: ['أبوظبي', 'ابوظبي'] },
  { city: 'Dubai', countryCode: 'AE', countryName: 'United Arab Emirates', aliases: ['دبي'] },
  { city: 'Sharjah', countryCode: 'AE', countryName: 'United Arab Emirates', aliases: ['الشارقة'] },
  { city: 'Al Ain', countryCode: 'AE', countryName: 'United Arab Emirates' },
  { city: 'Riyadh', countryCode: 'SA', countryName: 'Saudi Arabia', aliases: ['الرياض'] },
  { city: 'Jeddah', countryCode: 'SA', countryName: 'Saudi Arabia', aliases: ['جدة'] },
  { city: 'Doha', countryCode: 'QA', countryName: 'Qatar', aliases: ['الدوحة'] },
  { city: 'Muscat', countryCode: 'OM', countryName: 'Oman', aliases: ['مسقط'] },
  { city: 'Kuwait City', countryCode: 'KW', countryName: 'Kuwait', aliases: ['kuwait', 'الكويت'] },
  { city: 'Manama', countryCode: 'BH', countryName: 'Bahrain', aliases: ['المنامة'] },
  { city: 'Cairo', countryCode: 'EG', countryName: 'Egypt', aliases: ['القاهرة'] },
  { city: 'Amman', countryCode: 'JO', countryName: 'Jordan', aliases: ['عمان'] },
  { city: 'Beirut', countryCode: 'LB', countryName: 'Lebanon' },
  { city: 'London', countryCode: 'GB', countryName: 'United Kingdom', aliases: ['لندن'] },
  { city: 'Manchester', countryCode: 'GB', countryName: 'United Kingdom' },
  { city: 'Edinburgh', countryCode: 'GB', countryName: 'United Kingdom' },
  { city: 'New York', countryCode: 'US', countryName: 'United States', aliases: ['nyc', 'نيويورك'] },
  { city: 'Los Angeles', countryCode: 'US', countryName: 'United States' },
  { city: 'Chicago', countryCode: 'US', countryName: 'United States' },
  { city: 'San Francisco', countryCode: 'US', countryName: 'United States' },
  { city: 'Austin', countryCode: 'US', countryName: 'United States' },
  { city: 'Seattle', countryCode: 'US', countryName: 'United States' },
  { city: 'Boston', countryCode: 'US', countryName: 'United States' },
  { city: 'Toronto', countryCode: 'CA', countryName: 'Canada' },
  { city: 'Vancouver', countryCode: 'CA', countryName: 'Canada' },
  { city: 'Tokyo', countryCode: 'JP', countryName: 'Japan' },
  { city: 'Osaka', countryCode: 'JP', countryName: 'Japan' },
  { city: 'Seoul', countryCode: 'KR', countryName: 'South Korea' },
  { city: 'Singapore', countryCode: 'SG', countryName: 'Singapore' },
  { city: 'Mumbai', countryCode: 'IN', countryName: 'India' },
  { city: 'Delhi', countryCode: 'IN', countryName: 'India', aliases: ['new delhi'] },
  { city: 'Bengaluru', countryCode: 'IN', countryName: 'India', aliases: ['bangalore'] },
  { city: 'Karachi', countryCode: 'PK', countryName: 'Pakistan' },
  { city: 'Sydney', countryCode: 'AU', countryName: 'Australia' },
  { city: 'Melbourne', countryCode: 'AU', countryName: 'Australia' },
  { city: 'Auckland', countryCode: 'NZ', countryName: 'New Zealand' },
  { city: 'Berlin', countryCode: 'DE', countryName: 'Germany' },
  { city: 'Munich', countryCode: 'DE', countryName: 'Germany' },
  { city: 'Paris', countryCode: 'FR', countryName: 'France' },
  { city: 'Madrid', countryCode: 'ES', countryName: 'Spain' },
  { city: 'Barcelona', countryCode: 'ES', countryName: 'Spain' },
  { city: 'Rome', countryCode: 'IT', countryName: 'Italy' },
  { city: 'Amsterdam', countryCode: 'NL', countryName: 'Netherlands' },
  { city: 'Zurich', countryCode: 'CH', countryName: 'Switzerland' },
  { city: 'Stockholm', countryCode: 'SE', countryName: 'Sweden' },
  { city: 'Istanbul', countryCode: 'TR', countryName: 'Turkey' },
  { city: 'Jakarta', countryCode: 'ID', countryName: 'Indonesia' },
  { city: 'Manila', countryCode: 'PH', countryName: 'Philippines' },
  { city: 'Bangkok', countryCode: 'TH', countryName: 'Thailand' },
  { city: 'Hong Kong', countryCode: 'HK', countryName: 'Hong Kong' },
  { city: 'Shanghai', countryCode: 'CN', countryName: 'China' },
  { city: 'São Paulo', countryCode: 'BR', countryName: 'Brazil', aliases: ['sao paulo'] },
  { city: 'Mexico City', countryCode: 'MX', countryName: 'Mexico' },
  { city: 'Buenos Aires', countryCode: 'AR', countryName: 'Argentina' },
  { city: 'Nairobi', countryCode: 'KE', countryName: 'Kenya' },
  { city: 'Lagos', countryCode: 'NG', countryName: 'Nigeria' },
  { city: 'Johannesburg', countryCode: 'ZA', countryName: 'South Africa' },
  { city: 'Colombo', countryCode: 'LK', countryName: 'Sri Lanka' },
  { city: 'Kandy', countryCode: 'LK', countryName: 'Sri Lanka' },
  { city: 'Dhaka', countryCode: 'BD', countryName: 'Bangladesh' },
  { city: 'Kuala Lumpur', countryCode: 'MY', countryName: 'Malaysia' }
];

const QUICK_REGION_PRESETS = [
  { city: 'Abu Dhabi', label: 'Abu Dhabi, UAE' },
  { city: 'Dubai', label: 'Dubai, UAE' },
  { city: 'Riyadh', label: 'Riyadh, Saudi Arabia' },
  { city: 'London', label: 'London, UK' },
  { city: 'New York', label: 'New York, US' }
];

export interface InterviewParseResult {
  region?: RegionContext;
  age?: number;
  availabilityMode?: AvailabilityMode;
  availableWindows?: AvailableTimeWindow[];
  workPattern?: WorkPattern;
  climateSensitivity?: NonNullable<UserLifestyleProfile['climateSensitivity']>;
  culturalRhythms?: CulturalRhythmId[];
  isRamadanFastingObserver?: boolean;
  smokingStatus?: SmokingStatus;
  physicalCautions?: string[];
  /** Human-readable tags for analytics/crowdsourcing telemetry. */
  extractedTags: string[];
  /** Unmanaged custom tags to merge into activeTags (managed structured factors are synced canonically). */
  customTags: string[];
  acknowledgments: string[];
  answeredRegion: boolean;
  answeredAge: boolean;
  answeredAvailability: boolean;
  answeredAgeTime?: boolean;
  answeredRhythm: boolean;
  answeredCautions: boolean;
}

export function formatRegionLabel(region?: Partial<RegionContext>): string {
  const countryName = region?.countryName?.trim() || '';
  const city = region?.city?.trim() || '';
  if (city && countryName) return `${city}, ${countryName}`;
  return city || countryName;
}

/**
 * Detects if user input is an imperative command or question rather than a personal habit/descriptor.
 * Prevents action instructions (e.g. "change my region to colombo") from leaking into activeTags chips.
 */
export function isLifestyleCommandOrQuestion(text: string): boolean {
  const norm = text.toLowerCase().trim();
  if (!norm) return false;
  if (
    norm.endsWith('?') ||
    norm.startsWith('what') ||
    norm.startsWith('how') ||
    norm.startsWith('why') ||
    norm.startsWith('can i') ||
    norm.startsWith('could i') ||
    norm.startsWith('هل') ||
    norm.startsWith('كيف') ||
    norm.startsWith('ماذا') ||
    norm.startsWith('لماذا')
  ) {
    return true;
  }
  if (
    /^(?:change|set|switch|update|reset|clear|remove|delete|my region|my location|my age|my schedule|my time|i'm in|i am in|im in|live in|moved to|based in)\b/i.test(
      norm
    )
  ) {
    return true;
  }
  return /^(?:تغيير|غير|مسح|حذف|منطقتي|موقعي|عمري|أعيش في|أنا في)(?:\s|$)/i.test(norm);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Matches a city or alias as a standalone token (avoiding substring collisions inside longer words). */
function matchesCityToken(lowerText: string, token: string): boolean {
  const norm = token.toLowerCase();
  if (/^[a-z\s]+$/i.test(norm)) {
    const regex = new RegExp(`(?:^|[^a-z])${escapeRegExp(norm)}(?:$|[^a-z])`, 'i');
    return regex.test(lowerText);
  }
  return lowerText.includes(norm);
}

function to24HourMinutes(hourRaw: number, minuteRaw: number, meridiem?: string): number {
  let hour = hourRaw;
  if (meridiem) {
    const isPm = meridiem.toLowerCase().startsWith('p') || meridiem.startsWith('مساء');
    if (isPm && hour < 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;
  }
  return Math.max(0, Math.min(23 * 60 + 59, hour * 60 + minuteRaw));
}

/**
 * Extracts available daily time windows (ranges, multiple windows, single timestamps, named periods,
 * or "anytime / flexible") and returns remaining text with matched time spans stripped so age parsing stays accurate.
 */
function extractAvailabilityFromMessage(message: string): {
  availabilityMode?: AvailabilityMode;
  availableWindows?: AvailableTimeWindow[];
  remainingText: string;
} {
  let remaining = message;
  const collected: AvailableTimeWindow[] = [];

  // 1. Explicit 12h or mixed ranges (e.g. "7:30-9am", "7am to 8:30am", "7-9pm", "7:30am - 9:00am")
  const twelveRangeRegex =
    /\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm|a\.m\.|p\.m\.)?\s*(?:-|–|—|to)\s*(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm|a\.m\.|p\.m\.)\b/gi;
  remaining = remaining.replace(
    twelveRangeRegex,
    (match, h1, m1, mer1, h2, m2, mer2) => {
      const startMer = mer1 || mer2;
      const startMins = to24HourMinutes(Number.parseInt(h1, 10), m1 ? Number.parseInt(m1, 10) : 0, startMer);
      const endMins = to24HourMinutes(Number.parseInt(h2, 10), m2 ? Number.parseInt(m2, 10) : 0, mer2);
      collected.push({
        id: `win-${startMins}`,
        label: inferWindowLabel(startMins),
        start: formatMinutesToTime(startMins),
        end: formatMinutesToTime(endMins)
      });
      return ' ';
    }
  );

  // 2. Explicit 24-hour HH:mm ranges (e.g. "07:30–09:00", "19:00-21:00", "20:30 to 22:00")
  const twentyFourRangeRegex =
    /\b([01]?\d|2[0-3]):([0-5]\d)\s*(?:-|–|—|to)\s*([01]?\d|2[0-3]):([0-5]\d)\b/gi;
  remaining = remaining.replace(twentyFourRangeRegex, (_match, h1, m1, h2, m2) => {
    const startMins = Number.parseInt(h1, 10) * 60 + Number.parseInt(m1, 10);
    const endMins = Number.parseInt(h2, 10) * 60 + Number.parseInt(m2, 10);
    collected.push({
      id: `win-${startMins}`,
      label: inferWindowLabel(startMins),
      start: formatMinutesToTime(startMins),
      end: formatMinutesToTime(endMins)
    });
    return ' ';
  });

  // 3. Remaining standalone 12-hour timestamps (e.g. "7:30am", "8pm") -> expand into 60-min window
  const twelveHourRegex = /\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm|a\.m\.|p\.m\.)\b/gi;
  remaining = remaining.replace(twelveHourRegex, (_match, h1, m1, mer) => {
    const startMins = to24HourMinutes(Number.parseInt(h1, 10), m1 ? Number.parseInt(m1, 10) : 0, mer);
    const endMins = Math.min(23 * 60 + 45, startMins + 60);
    collected.push({
      id: `win-${startMins}`,
      label: inferWindowLabel(startMins),
      start: formatMinutesToTime(startMins),
      end: formatMinutesToTime(endMins)
    });
    return ' ';
  });

  // 4. Remaining standalone 24-hour HH:mm timestamps -> expand into 60-min window
  const twentyFourRegex = /\b([01]?\d|2[0-3]):([0-5]\d)\b/g;
  remaining = remaining.replace(twentyFourRegex, (_match, h1, m1) => {
    const startMins = Number.parseInt(h1, 10) * 60 + Number.parseInt(m1, 10);
    const endMins = Math.min(23 * 60 + 45, startMins + 60);
    collected.push({
      id: `win-${startMins}`,
      label: inferWindowLabel(startMins),
      start: formatMinutesToTime(startMins),
      end: formatMinutesToTime(endMins)
    });
    return ' ';
  });

  // 5. Arabic am/pm phrasing (e.g. "7 صباحاً", "8 مساءً")
  const arabicHourRegex = /\b(1[0-2]|0?[1-9])\s*(صباحاً|صباحا|مساءً|مساءا)/g;
  remaining = remaining.replace(arabicHourRegex, (_match, h1, mer) => {
    const startMins = to24HourMinutes(Number.parseInt(h1, 10), 0, mer);
    const endMins = Math.min(23 * 60 + 45, startMins + 60);
    collected.push({
      id: `win-${startMins}`,
      label: inferWindowLabel(startMins),
      start: formatMinutesToTime(startMins),
      end: formatMinutesToTime(endMins)
    });
    return ' ';
  });

  const normalizedExplicit = normalizeAvailableWindows(collected);
  if (normalizedExplicit.length > 0) {
    return {
      availabilityMode: 'windows',
      availableWindows: normalizedExplicit,
      remainingText: remaining
    };
  }

  // 6. Explicit anytime / flexible intent
  const lower = message.toLowerCase();
  if (
    /(?:anytime|any\s*time|flexible|no\s*fixed|whenever|في أي وقت|مرن)/i.test(lower)
  ) {
    return {
      availabilityMode: 'anytime',
      remainingText: remaining
    };
  }

  // 7. Named daily periods (can capture multiple in one message, e.g. "mornings and evenings")
  const namedWindows: AvailableTimeWindow[] = [];
  if (lower.includes('dawn') || lower.includes('fajr') || lower.includes('الفجر')) {
    namedWindows.push({ id: 'dawn', label: 'Dawn', start: '05:30', end: '07:00' });
  } else if (lower.includes('early morning') || lower.includes('قبل العمل')) {
    namedWindows.push({ id: 'early-morning', label: 'Early Morning', start: '06:00', end: '07:30' });
  } else if (lower.includes('morning') || lower.includes('صباح')) {
    namedWindows.push({ id: 'morning', label: 'Morning', start: '07:30', end: '09:00' });
  }

  if (lower.includes('midday') || lower.includes('noon') || lower.includes('lunch') || lower.includes('ظهر')) {
    namedWindows.push({ id: 'midday', label: 'Midday', start: '12:30', end: '13:30' });
  }
  if (lower.includes('afternoon') || lower.includes('عصر')) {
    namedWindows.push({ id: 'afternoon', label: 'Afternoon', start: '15:00', end: '16:30' });
  }
  if (lower.includes('post-iftar') || lower.includes('after iftar') || lower.includes('بعد الإفطار')) {
    namedWindows.push({ id: 'post-iftar', label: 'Post-Iftar', start: '20:30', end: '22:00' });
  } else if (lower.includes('post-dinner') || lower.includes('after dinner') || lower.includes('بعد العشاء')) {
    namedWindows.push({ id: 'post-dinner', label: 'Post-Dinner', start: '21:30', end: '22:30' });
  } else if (lower.includes('evening') || lower.includes('مساء')) {
    namedWindows.push({ id: 'evening', label: 'Evening', start: '19:00', end: '21:00' });
  } else if (lower.includes('late night') || lower.includes('bedtime') || lower.includes('قبل النوم')) {
    namedWindows.push({ id: 'night', label: 'Night', start: '21:00', end: '22:30' });
  }

  const normalizedNamed = normalizeAvailableWindows(namedWindows);
  if (normalizedNamed.length > 0) {
    return {
      availabilityMode: 'windows',
      availableWindows: normalizedNamed,
      remainingText: remaining
    };
  }

  return { remainingText: remaining };
}

function extractAgeFromMessage(remainingText: string, stage: LifestyleInterviewStage): number | undefined {
  // Explicit age phrasing works at any stage
  const explicitPatterns = [
    /(?:i'm|i am|im|age|aged)\s+(\d{2,3})\b/i,
    /\b(\d{2,3})\s*(?:years?\s*old|y\/o|yo|yrs?\s*old)\b/i,
    /عمري\s*(\d{2,3})/,
    /(\d{2,3})\s*(?:سنة|عاماً|عاما|عام)/
  ];
  for (const pattern of explicitPatterns) {
    const match = pattern.exec(remainingText);
    if (match) {
      const valid = sanitizeAge(match[1]);
      if (valid !== undefined) return valid;
    }
  }

  // On the age stage (or legacy age_time), a bare number like "34" or "34, evenings" is clearly the user's age
  if (stage === 'age' || stage === 'age_time') {
    // Strip ratios like 16:8 or 9-5 or 12h first
    const cleaned = remainingText
      .replace(/\b\d+\s*[-–]\s*\d+\b/g, ' ')
      .replace(/\b\d+\s*h(?:ours?|rs?)?\b/gi, ' ');
    const bareMatch = /\b(\d{2,3})\b/.exec(cleaned);
    if (bareMatch) {
      return sanitizeAge(bareMatch[1]);
    }
  }

  return undefined;
}

function extractRegionFromMessage(
  message: string,
  stage: LifestyleInterviewStage,
  currentRegion: RegionContext
): { region?: RegionContext; confirmed: boolean } {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // Affirmative confirmation on region stage (including quick reply "Yes, Abu Dhabi" / "نعم، Abu Dhabi")
  if (stage === 'region') {
    const isAffirmative =
      /^(?:yes|yep|yeah|yup|correct|right|exact|confirm|confirmed|that's right|thats right|same|all good|sounds right|نعم|أجل|صحيح|أيوه|نعم،)/i.test(
        trimmed
      );
    if (isAffirmative) {
      // Check if user said "Yes, actually Dubai" — if a DIFFERENT known city is mentioned, prefer it
      const mentionedCity = KNOWN_CITIES.find(
        (preset) =>
          matchesCityToken(lower, preset.city) ||
          (preset.aliases?.some((alias) => matchesCityToken(lower, alias)) ?? false)
      );
      if (mentionedCity && mentionedCity.city.toLowerCase() !== (currentRegion.city || '').toLowerCase()) {
        return {
          region: {
            countryCode: mentionedCity.countryCode,
            countryName: mentionedCity.countryName,
            city: mentionedCity.city,
            detectedBy: 'user_selected',
            confirmed: true
          },
          confirmed: true
        };
      }
      if (currentRegion.countryCode || currentRegion.countryName) {
        return {
          region: {
            ...currentRegion,
            detectedBy: currentRegion.detectedBy || 'user_selected',
            confirmed: true
          },
          confirmed: true
        };
      }
      return { confirmed: false };
    }
  }

  // Check known cities at region stage OR when preceded by explicit location phrasing at any stage
  const hasExplicitLocationLead =
    /(?:i'm in|i am in|im in|live in|based in|from|moved to|located in|joining from|tracking from|in\s+[a-z]|change\s+(?:my\s+)?(?:region|location|city|country)\s+to|set\s+(?:my\s+)?(?:region|location|city|country)\s+to|switch\s+(?:my\s+)?(?:region|location|city|country)\s+to|update\s+(?:my\s+)?(?:region|location|city|country)\s+to|(?:my\s+)?(?:region|location)\s+(?:is|to)|أنا في|أعيش في|من\s+|(?:تغيير|غير)\s+(?:المنطقة|منطقتي|الموقع|موقعي)\s*(?:إلى)?|منطقتي\s+هي)/i.test(
      trimmed
    );

  if (stage === 'region' || hasExplicitLocationLead) {
    const knownCity = KNOWN_CITIES.find(
      (preset) =>
        matchesCityToken(lower, preset.city) ||
        (preset.aliases?.some((alias) => matchesCityToken(lower, alias)) ?? false)
    );
    if (knownCity) {
      return {
        region: {
          countryCode: knownCity.countryCode,
          countryName: knownCity.countryName,
          city: knownCity.city,
          detectedBy: 'user_selected',
          confirmed: true
        },
        confirmed: true
      };
    }
  }

  // Free-form "City, Country" or single location on the region stage OR when preceded by explicit location phrasing
  if (stage === 'region' || hasExplicitLocationLead) {
    const cleanedLocation = trimmed
      .replace(
        /^(?:no,?\s*|actually,?\s*|not quite,?\s*)?(?:i'm|i am|im|we are|currently|i live|i'm based|based|joining|tracking|moved|located)?\s*(?:in|from|at|to)?\s*/i,
        ''
      )
      .replace(
        /^(?:change|set|switch|update)\s+(?:my\s+)?(?:region|location|city|country)?\s*(?:to|is)?\s*/i,
        ''
      )
      .replace(/^(?:my\s+)?(?:region|location|city|country)\s+(?:is|to)\s*/i, '')
      .replace(/^(?:لا،?\s*)?(?:أنا\s*في|أعيش\s*في|من)\s*/i, '')
      .replace(/^(?:تغيير|غير)\s+(?:المنطقة|منطقتي|الموقع|موقعي)\s*(?:إلى)?\s*/i, '')
      .replace(/^(?:منطقتي|موقعي)\s*هي\s*/i, '')
      .replace(/[.!?]+$/, '')
      .trim();

    if (cleanedLocation.includes(',')) {
      const parts = cleanedLocation.split(',').map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const cityPart = parts[0];
        const countryPart = parts[1];
        const code = resolveCountryCodeFromInput(countryPart);
        const resolvedName = resolveCountryName(code);
        const isCodeOrShort = /^(?:[A-Za-z]{2}|usa|uk|uae)$/i.test(countryPart);
        return {
          region: {
            countryCode: code,
            countryName: isCodeOrShort ? resolvedName : countryPart,
            city: cityPart,
            detectedBy: 'user_selected',
            confirmed: true
          },
          confirmed: true
        };
      }
    }

    if (cleanedLocation.length >= 2 && cleanedLocation.length <= 48) {
      const code = resolveCountryCodeFromInput(cleanedLocation);
      const resolvedName = resolveCountryName(code);
      const matchedCountry =
        resolvedName.toLowerCase() === cleanedLocation.toLowerCase() ||
        /^(?:[A-Za-z]{2}|usa|uk|uae)$/i.test(cleanedLocation);
      return {
        region: {
          countryCode: code,
          countryName: matchedCountry ? resolvedName : cleanedLocation,
          city: matchedCountry ? undefined : cleanedLocation,
          detectedBy: 'user_selected',
          confirmed: true
        },
        confirmed: true
      };
    }
  }

  return { confirmed: false };
}

/**
 * Pure, deterministic conversational parser for the Adaptive Lifestyle Interview.
 * Extracts region, age, preferred reminder time, work pattern, climate, cultural rhythms,
 * physical cautions, and smoking status — including when multiple answers appear in one message.
 */
export function parseConversationalLifestyleAnswer(
  message: string,
  stage: LifestyleInterviewStage,
  context: {
    currentRegion: RegionContext;
    currentProfile?: Partial<UserLifestyleProfile>;
    currentUserProfile?: Partial<UserProfile>;
  }
): InterviewParseResult {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  const result: InterviewParseResult = {
    extractedTags: [],
    customTags: [],
    acknowledgments: [],
    answeredRegion: false,
    answeredAge: false,
    answeredAvailability: false,
    answeredAgeTime: false,
    answeredRhythm: false,
    answeredCautions: false
  };

  // 1. Region
  const regionCheck = extractRegionFromMessage(trimmed, stage, context.currentRegion);
  if (regionCheck.confirmed && regionCheck.region) {
    result.region = regionCheck.region;
    result.answeredRegion = true;
    result.acknowledgments.push(formatRegionLabel(regionCheck.region));
  }

  // 2. Available Time Windows & Age
  const { availabilityMode, availableWindows, remainingText } = extractAvailabilityFromMessage(trimmed);
  const age = extractAgeFromMessage(remainingText, stage);
  const isSkipAge =
    (stage === 'age' || stage === 'age_time') &&
    /(?:skip|prefer not|no preference|pass|تخطي|لا أفضل|تجاوز)/i.test(trimmed);
  const isSkipAvailability =
    (stage === 'availability' || stage === 'age_time') &&
    /(?:skip|no preference|either|anytime|flexible|whenever|تخطي|لا يهم|في أي وقت|مرن)/i.test(trimmed);

  if (age !== undefined) {
    result.age = age;
    result.answeredAge = true;
    result.acknowledgments.push(`age ${age}`);
  }
  if (isSkipAge) {
    result.answeredAge = true;
    result.acknowledgments.push('age skipped');
  }

  if (availableWindows && availableWindows.length > 0) {
    result.availabilityMode = 'windows';
    result.availableWindows = availableWindows;
    result.answeredAvailability = true;
    result.acknowledgments.push(availableWindows.map(formatWindowRange).join(' & '));
  } else if (availabilityMode === 'anytime') {
    result.availabilityMode = 'anytime';
    result.answeredAvailability = true;
    result.acknowledgments.push('flexible anytime schedule');
  }

  if (isSkipAvailability) {
    result.answeredAvailability = true;
    if (!result.availabilityMode && !context.currentUserProfile?.availabilityMode) {
      result.availabilityMode = 'anytime';
      result.acknowledgments.push('flexible anytime schedule');
    }
  }

  if (stage === 'age_time') {
    result.answeredAgeTime = Boolean(
      result.answeredAge || result.answeredAvailability || isSkipAge || isSkipAvailability
    );
    if (result.answeredAgeTime) {
      result.answeredAge = true;
      result.answeredAvailability = true;
    }
  } else {
    result.answeredAgeTime = Boolean(result.answeredAge && result.answeredAvailability);
  }

  // 3. Work pattern, climate & cultural rhythms
  if (
    lower.includes('shift') ||
    lower.includes('night shift') ||
    lower.includes('rotating') ||
    lower.includes('icu') ||
    lower.includes('hospital') ||
    lower.includes('نوبات') ||
    lower.includes('ورديات')
  ) {
    result.workPattern = 'shift_work';
    result.extractedTags.push('Shift Work / Night Shifts');
    result.acknowledgments.push('shift-work schedule');
    result.answeredRhythm = true;
  } else if (
    lower.includes('desk') ||
    lower.includes('sitting') ||
    lower.includes('sedentary') ||
    lower.includes('office') ||
    lower.includes('screen') ||
    lower.includes('مكتبي')
  ) {
    result.workPattern = 'desk_sedentary';
    result.extractedTags.push('Desk-bound Sedentary');
    result.customTags.push('Desk-bound Sedentary');
    result.acknowledgments.push('desk-bound work');
    result.answeredRhythm = true;
  } else if (
    lower.includes('travel') ||
    lower.includes('flight') ||
    lower.includes('commute') ||
    lower.includes('سفر')
  ) {
    result.workPattern = 'frequent_travel';
    result.extractedTags.push('Frequent Travel');
    result.customTags.push('Frequent Travel');
    result.acknowledgments.push('frequent travel');
    result.answeredRhythm = true;
  }

  if (
    lower.includes('heat') ||
    lower.includes('summer') ||
    lower.includes('hot') ||
    lower.includes('حرارة') ||
    lower.includes('الصيف')
  ) {
    result.climateSensitivity = 'summer_heat';
    result.extractedTags.push('Summer Heat Adaptation');
    result.acknowledgments.push('summer heat adaptation');
    result.answeredRhythm = true;
  } else if (
    lower.includes('cold') ||
    lower.includes('winter') ||
    lower.includes('snow') ||
    lower.includes('low sunlight') ||
    lower.includes('شتاء') ||
    lower.includes('برد')
  ) {
    result.climateSensitivity = 'cold_climate';
    result.extractedTags.push('Cold Climate / Winter');
    result.customTags.push('Cold Climate / Winter');
    result.acknowledgments.push('cold-climate pacing');
    result.answeredRhythm = true;
  }

  const detectedRhythms = new Set<CulturalRhythmId>(resolveCulturalRhythms(context.currentProfile));
  let addedRhythm = false;

  if (
    lower.includes('ramadan') ||
    lower.includes('suhoor') ||
    lower.includes('iftar') ||
    lower.includes('رمضان') ||
    lower.includes('إفطار')
  ) {
    result.isRamadanFastingObserver = true;
    detectedRhythms.add('ramadan_fasting');
    result.extractedTags.push('Ramadan Fasting Observer');
    result.acknowledgments.push('Ramadan fasting hours');
    addedRhythm = true;
  } else if (
    lower.includes('intermittent') ||
    lower.includes('16:8') ||
    lower.includes('omad') ||
    lower.includes('صيام متقطع')
  ) {
    detectedRhythms.add('intermittent_fasting');
    result.extractedTags.push('Intermittent Fasting (16:8)');
    result.acknowledgments.push('intermittent fasting');
    addedRhythm = true;
  } else if (
    lower.includes('lent') ||
    lower.includes('ekadashi') ||
    lower.includes('fasting') ||
    lower.includes('صيام')
  ) {
    detectedRhythms.add('periodic_religious_fasting');
    result.extractedTags.push('Periodic Fasting');
    result.acknowledgments.push('periodic fasting');
    addedRhythm = true;
  }

  if (lower.includes('late dinner') || lower.includes('late meal') || lower.includes('عشاء متأخر')) {
    detectedRhythms.add('late_family_dinner');
    result.extractedTags.push('Late Family Dinner (21:00+)');
    result.acknowledgments.push('late family dinners');
    addedRhythm = true;
  }
  if (
    lower.includes('dawn') ||
    lower.includes('fajr') ||
    lower.includes('early riser') ||
    lower.includes('استيقاظ مبكر') ||
    lower.includes('الفجر')
  ) {
    detectedRhythms.add('early_dawn_riser');
    result.extractedTags.push('Early Dawn Riser');
    result.acknowledgments.push('early dawn routine');
    addedRhythm = true;
  }
  if (
    lower.includes('siesta') ||
    lower.includes('midday rest') ||
    lower.includes('afternoon nap') ||
    lower.includes('قيلولة')
  ) {
    detectedRhythms.add('midday_siesta_rest');
    result.extractedTags.push('Midday Rest / Siesta');
    result.acknowledgments.push('midday rest window');
    addedRhythm = true;
  }
  if (
    lower.includes('sabbath') ||
    lower.includes('shabbat') ||
    lower.includes('sunday rest') ||
    lower.includes('weekly rest') ||
    lower.includes('راحة أسبوعية')
  ) {
    detectedRhythms.add('sabbath_weekly_rest');
    result.extractedTags.push('Weekly Rest / Sabbath');
    result.acknowledgments.push('weekly rest day');
    addedRhythm = true;
  }
  if (
    lower.includes('multi-generational') ||
    lower.includes('shared household') ||
    lower.includes('extended family') ||
    lower.includes('أسرة ممتدة')
  ) {
    detectedRhythms.add('collectivist_household');
    result.extractedTags.push('Shared Household Schedule');
    result.acknowledgments.push('shared household rhythm');
    addedRhythm = true;
  }

  if (addedRhythm) {
    result.culturalRhythms = Array.from(detectedRhythms);
    result.answeredRhythm = true;
  }

  const isStandardOrNoneRhythm =
    stage === 'rhythm' &&
    /(?:standard|regular|normal|9\s*[-–to]+\s*5|none|nothing|skip|منتظم|لا شيء|عادي)/i.test(trimmed);

  if (isStandardOrNoneRhythm) {
    if (!result.workPattern) result.workPattern = 'standard';
    if (!result.climateSensitivity) result.climateSensitivity = 'moderate';
    result.answeredRhythm = true;
    if (result.acknowledgments.length === 0) {
      result.acknowledgments.push('standard daily schedule');
    }
  } else if (
    stage === 'rhythm' &&
    !result.answeredRhythm &&
    !result.answeredRegion &&
    trimmed.length >= 2 &&
    !isLifestyleCommandOrQuestion(trimmed)
  ) {
    // Capture custom rhythm/schedule note cleanly on rhythm turn
    result.extractedTags.push(trimmed);
    result.customTags.push(trimmed);
    result.acknowledgments.push(trimmed);
    result.answeredRhythm = true;
  }

  // 4. Physical cautions & smoking status
  const cautions = new Set<string>(context.currentProfile?.physicalCautions ?? []);
  let addedCaution = false;

  const cautionMatchers: Array<{ regex: RegExp; label: string }> = [
    { regex: /\bknee|ركب/i, label: 'Knee sensitivity' },
    { regex: /\b(?:lower\s*back|lumbar|back\s*(?:pain|stiffness|ache|sensitivity)|ظهر)/i, label: 'Lower back sensitivity' },
    { regex: /\bshoulder|كتف/i, label: 'Shoulder mobility limit' },
    { regex: /\b(?:ankle|achilles)|كاحل|أخيل/i, label: 'Ankle / Achilles tenderness' },
    { regex: /\bneck|رقبة/i, label: 'Neck tension' },
    { regex: /\bwrist|معصم/i, label: 'Wrist sensitivity' },
    { regex: /\bhip|ورك/i, label: 'Hip stiffness' }
  ];

  for (const matcher of cautionMatchers) {
    if (matcher.regex.test(trimmed)) {
      cautions.add(matcher.label);
      result.extractedTags.push(matcher.label);
      result.customTags.push(matcher.label);
      result.acknowledgments.push(matcher.label.toLowerCase());
      addedCaution = true;
    }
  }

  if (!addedCaution && /\b(?:joint|arthritis|stiff|tendon|ache|pain|sore)|مفاصل|ألم/i.test(trimmed) && !/\bno\s+(?:pain|caution|joint|issue)/i.test(trimmed)) {
    cautions.add('Joint sensitivity');
    result.extractedTags.push('Joint sensitivity');
    result.customTags.push('Joint sensitivity');
    result.acknowledgments.push('joint sensitivity');
    addedCaution = true;
  }

  if (addedCaution) {
    result.physicalCautions = Array.from(cautions);
    result.answeredCautions = true;
  }

  // Smoking / tobacco (check non-smoker and former smoker BEFORE generic smoke/cig)
  if (
    /non[-\s]?smoker|don't smoke|do not smoke|never smoke|no smoking|غير مدخن|لا أدخن/i.test(trimmed)
  ) {
    result.smokingStatus = 'non_smoker';
    result.answeredCautions = true;
  } else if (/former smoker|ex[-\s]?smoker|quit smoking|أقلعت/i.test(trimmed)) {
    result.smokingStatus = 'former_smoker';
    result.acknowledgments.push('former smoker recovery baseline');
    result.answeredCautions = true;
  } else if (/dokha|midwakh|medwakh|دوخة|مدواخ/i.test(trimmed)) {
    result.smokingStatus = 'midwakh_dokha';
    result.extractedTags.push('Midwakh / Dokha Tobacco');
    result.acknowledgments.push('Midwakh / Dokha pacing');
    result.answeredCautions = true;
  } else if (/shisha|hookah|waterpipe|nargile|moassel|شيشة|أرجيلة/i.test(trimmed)) {
    result.smokingStatus = 'shisha_waterpipe';
    result.extractedTags.push('Shisha / Waterpipe');
    result.acknowledgments.push('shisha / waterpipe pacing');
    result.answeredCautions = true;
  } else if (/vape|vaping|e-cig|juul|فيب/i.test(trimmed)) {
    result.smokingStatus = 'vape';
    result.extractedTags.push('Vape / E-cigarette');
    result.customTags.push('Vape / E-cigarette');
    result.acknowledgments.push('vape recovery pacing');
    result.answeredCautions = true;
  } else if (/\bcig|cigarette|smoking|smoker|سجائر|أدخن/i.test(trimmed)) {
    result.smokingStatus = 'cigarettes';
    result.extractedTags.push('Cigarettes');
    result.customTags.push('Cigarettes');
    result.acknowledgments.push('smoking recovery pacing');
    result.answeredCautions = true;
  }

  const isNoCautions =
    stage === 'cautions' &&
    /(?:no\s*caution|none|nothing|all good|healthy|skip|لا توجد|لا يوجد|لا شيء)/i.test(trimmed);

  if (isNoCautions) {
    if (!result.smokingStatus) {
      result.smokingStatus = context.currentProfile?.smokingStatus || 'non_smoker';
    }
    result.answeredCautions = true;
    if (result.acknowledgments.length === 0) {
      result.acknowledgments.push('no physical cautions');
    }
  } else if (stage === 'cautions' && !result.answeredCautions && trimmed.length >= 2) {
    cautions.add(trimmed);
    result.physicalCautions = Array.from(cautions);
    result.extractedTags.push(trimmed);
    result.customTags.push(trimmed);
    result.acknowledgments.push(trimmed);
    result.answeredCautions = true;
  }

  return result;
}

/**
 * Advances the conversational interview to the next unanswered stage, skipping any
 * future topics the user already answered proactively in the same message.
 */
export function computeNextInterviewStage(
  currentStage: LifestyleInterviewStage,
  parsed: InterviewParseResult,
  answeredStages: ReadonlySet<LifestyleInterviewStage>
): { nextStage: LifestyleInterviewStage; updatedAnswered: LifestyleInterviewStage[] } {
  const nextAnswered = new Set<LifestyleInterviewStage>(answeredStages);

  if (currentStage !== 'complete') {
    nextAnswered.add(currentStage);
    if (currentStage === 'age_time') {
      nextAnswered.add('age');
      nextAnswered.add('availability');
    }
  }
  if (parsed.answeredRegion) nextAnswered.add('region');
  if (parsed.answeredAge) nextAnswered.add('age');
  if (parsed.answeredAvailability) nextAnswered.add('availability');
  if (parsed.answeredAgeTime || answeredStages.has('age_time')) {
    nextAnswered.add('age_time');
    nextAnswered.add('age');
    nextAnswered.add('availability');
  }
  if (parsed.answeredRhythm) nextAnswered.add('rhythm');
  if (parsed.answeredCautions) nextAnswered.add('cautions');

  if (currentStage === 'complete') {
    return { nextStage: 'complete', updatedAnswered: Array.from(nextAnswered) };
  }

  for (const stage of INTERVIEW_STAGE_ORDER) {
    if (!nextAnswered.has(stage)) {
      return { nextStage: stage, updatedAnswered: Array.from(nextAnswered) };
    }
  }

  return { nextStage: 'complete', updatedAnswered: Array.from(nextAnswered) };
}

/** Builds merged UserLifestyleProfile & UserProfile updates from a parsed conversational turn. */
export function buildProfileUpdatesFromParse(
  parsed: InterviewParseResult,
  nextStage: LifestyleInterviewStage,
  currentProfile?: Partial<UserLifestyleProfile>,
  currentUserProfile?: Partial<UserProfile>,
  activeRoutineTitle?: string
): {
  profileUpdates: Partial<UserLifestyleProfile>;
  userProfileUpdates: Partial<UserProfile>;
  suggestedFocus: string;
} {
  const existingTags = currentProfile?.activeTags ?? [];
  const mergedTags = Array.from(new Set([...existingTags, ...parsed.customTags]));

  const provisionalLifestyle: Partial<UserLifestyleProfile> = {
    ...currentProfile,
    ...(parsed.region ? { region: parsed.region } : {}),
    ...(parsed.workPattern ? { workPattern: parsed.workPattern } : {}),
    ...(parsed.climateSensitivity ? { climateSensitivity: parsed.climateSensitivity } : {}),
    ...(parsed.culturalRhythms ? { culturalRhythms: parsed.culturalRhythms } : {}),
    ...(parsed.isRamadanFastingObserver !== undefined
      ? { isRamadanFastingObserver: parsed.isRamadanFastingObserver }
      : {}),
    ...(parsed.smokingStatus ? { smokingStatus: parsed.smokingStatus } : {}),
    ...(parsed.physicalCautions ? { physicalCautions: parsed.physicalCautions } : {}),
    activeTags: mergedTags
  };

  const syncedTags = syncLifestyleActiveTags(provisionalLifestyle);
  const resolvedAge = parsed.age ?? currentUserProfile?.age;
  const suggestedFocus = deriveClinicalFocus(provisionalLifestyle, {
    age: resolvedAge,
    routineTitle: activeRoutineTitle
  });

  const profileUpdates: Partial<UserLifestyleProfile> = {
    ...(parsed.region ? { region: parsed.region } : {}),
    ...(parsed.workPattern ? { workPattern: parsed.workPattern } : {}),
    ...(parsed.climateSensitivity ? { climateSensitivity: parsed.climateSensitivity } : {}),
    ...(parsed.culturalRhythms ? { culturalRhythms: parsed.culturalRhythms } : {}),
    ...(parsed.isRamadanFastingObserver !== undefined
      ? { isRamadanFastingObserver: parsed.isRamadanFastingObserver }
      : {}),
    ...(parsed.smokingStatus ? { smokingStatus: parsed.smokingStatus } : {}),
    ...(parsed.physicalCautions ? { physicalCautions: parsed.physicalCautions } : {}),
    activeTags: syncedTags,
    ...(nextStage === 'complete' ? { intakeCompleted: true } : {})
  };

  const userProfileUpdates: Partial<UserProfile> = {
    ...(parsed.age !== undefined ? { age: parsed.age } : {}),
    ...(parsed.availabilityMode ? { availabilityMode: parsed.availabilityMode } : {}),
    ...(parsed.availableWindows && parsed.availableWindows.length > 0
      ? { availableWindows: parsed.availableWindows }
      : {}),
    ...(nextStage === 'complete' ? { clinicalGoals: suggestedFocus } : {})
  };

  return { profileUpdates, userProfileUpdates, suggestedFocus };
}

/** Returns the localized AI question prompt for a given interview stage. */
export function getStageQuestion(
  stage: LifestyleInterviewStage,
  regionLabel: string,
  copy: LocaleCopy,
  options?: { suggestedFocus?: string }
): string {
  const t = copy.lifestyleTuning.onboarding;
  switch (stage) {
    case 'region':
      return regionLabel ? t.greetingRegion(regionLabel) : copy.lifestyleTuning.unknownLocationGreeting;
    case 'age':
      return t.askAge;
    case 'availability':
      return t.askAvailability;
    case 'age_time':
      return t.askAgeTime;
    case 'rhythm':
      return t.askRhythm(regionLabel || 'your area');
    case 'cautions':
      return t.askCautions;
    case 'complete':
      return t.completionSummary(options?.suggestedFocus || deriveClinicalFocus());
  }
}

/** Returns the localized composer placeholder matching the AI's current question. */
export function getStagePlaceholder(stage: LifestyleInterviewStage, copy: LocaleCopy): string {
  const t = copy.lifestyleTuning.onboarding;
  switch (stage) {
    case 'region':
      return t.placeholderRegion;
    case 'age':
      return t.placeholderAge;
    case 'availability':
      return t.placeholderAvailability;
    case 'age_time':
      return t.placeholderAgeTime;
    case 'rhythm':
      return t.placeholderRhythm;
    case 'cautions':
      return t.placeholderCautions;
    case 'complete':
      return t.placeholderComplete;
  }
}

/** Builds a warm, deterministic conversational reply acknowledging what the user shared + asking the next question. */
export function buildConversationalLifestyleReply(options: {
  parsed: InterviewParseResult;
  nextStage: LifestyleInterviewStage;
  regionLabel: string;
  suggestedFocus: string;
  copy: LocaleCopy;
  locale?: 'en' | 'ar';
}): string {
  const { parsed, nextStage, regionLabel, suggestedFocus, copy, locale = 'en' } = options;

  if (nextStage === 'complete') {
    return copy.lifestyleTuning.onboarding.completionSummary(suggestedFocus);
  }

  const nextQuestion = getStageQuestion(nextStage, regionLabel, copy, { suggestedFocus });
  const ackItems = Array.from(new Set(parsed.acknowledgments)).slice(0, 3);
  if (ackItems.length === 0) {
    return nextQuestion;
  }

  const ackPrefix =
    locale === 'ar'
      ? `تم تسجيل ذلك (${ackItems.join('، ')}).`
      : `Got it — ${ackItems.join(', ')}.`;

  return `${ackPrefix} ${nextQuestion}`;
}

/** Formats a short, human-readable summary of an already-calibrated profile for returning greetings. */
export function formatProfileSummary(
  lifestyleProfile?: Partial<UserLifestyleProfile>,
  userProfile?: Partial<UserProfile>,
  copy?: LocaleCopy
): string {
  const parts: string[] = [];
  if (userProfile?.availabilityMode || (userProfile?.availableWindows && userProfile.availableWindows.length > 0)) {
    parts.push(formatAvailabilitySummary(userProfile));
  }
  if (lifestyleProfile?.workPattern && lifestyleProfile.workPattern !== 'standard' && copy) {
    parts.push(copy.profile.workPatterns[lifestyleProfile.workPattern]);
  }
  const activeTags = lifestyleProfile?.activeTags ?? [];
  for (const tag of activeTags.slice(0, 2)) {
    const label = formatLifestyleTagLabel(tag);
    if (!parts.some((p) => p.toLowerCase() === label.toLowerCase())) {
      parts.push(label);
    }
  }
  return parts.slice(0, 3).join(' · ');
}

/** Generates contextual quick-reply chips for the footer (rendered via FaqSuggestions, matching Ask paper). */
export function getQuickRepliesForStage(options: {
  stage: LifestyleInterviewStage;
  lifestyleProfile?: Partial<UserLifestyleProfile>;
  suggestions: RegionalLifestyleTag[];
  copy: LocaleCopy;
  hasActiveRoutine?: boolean;
}): string[] {
  const { stage, lifestyleProfile, suggestions, copy, hasActiveRoutine = true } = options;
  const t = copy.lifestyleTuning.onboarding;
  const pCopy = copy.profile;
  const region = lifestyleProfile?.region;
  const countryCode = region?.countryCode || '';
  const countryName = region?.countryName || '';
  const city = region?.city || '';
  const culturalRhythms = resolveCulturalRhythms(lifestyleProfile);
  const activeTagSet = new Set(
    (lifestyleProfile?.activeTags ?? []).map((tag) => formatLifestyleTagLabel(tag).toLowerCase())
  );

  switch (stage) {
    case 'region': {
      const detectedLabel = city || countryName;
      const alternates = QUICK_REGION_PRESETS
        .filter((preset) => preset.city.toLowerCase() !== city.toLowerCase())
        .map((preset) => preset.label);
      if (detectedLabel) {
        const confirmChip = copy.lifestyleTuning.confirmLocationBtn(detectedLabel);
        return [confirmChip, ...alternates].slice(0, 5);
      }
      return alternates.slice(0, 5);
    }
    case 'age': {
      return [t.quickSkipAge];
    }
    case 'availability':
    case 'age_time': {
      const presets = getRegionalAvailabilityPresets({
        countryCode,
        isRamadanFastingObserver: culturalRhythms.includes('ramadan_fasting'),
        culturalRhythms,
        basePresets: pCopy.availabilityPresets,
        fastingPreset: pCopy.fastingAvailabilityPreset,
        dawnPreset: pCopy.dawnAvailabilityPreset,
        lateDinnerPreset: pCopy.lateDinnerAvailabilityPreset
      });
      const presetLabels = presets.map((p) => `${p.label} ${p.start}–${p.end}`);
      return [...presetLabels, t.quickAnytime].slice(0, 5);
    }
    case 'rhythm': {
      const regionalLabels = suggestions
        .filter((s) => s.category === 'schedule' || s.category === 'culture' || s.category === 'environment')
        .map((s) => formatLifestyleTagLabel(s.label))
        .filter((label) => !activeTagSet.has(label.toLowerCase()));

      const isFastingRegion = isFastingContextRegion(countryCode) || culturalRhythms.includes('ramadan_fasting');
      const isExtremeHeatRegion = ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'EG', 'IQ'].includes(countryCode);
      const isColdRegion = ['GB', 'SE', 'NO', 'FI', 'CA', 'RU', 'IS', 'DK'].includes(countryCode);

      const fallbackLabels = [
        pCopy.workPatterns.desk_sedentary,
        pCopy.workPatterns.shift_work,
        isFastingRegion ? pCopy.culturalRhythmOptions.ramadan_fasting : pCopy.culturalRhythmOptions.intermittent_fasting,
        isExtremeHeatRegion
          ? pCopy.climateOptions.summer_heat
          : isColdRegion
            ? pCopy.climateOptions.cold_climate
            : pCopy.culturalRhythmOptions.early_dawn_riser,
        pCopy.culturalRhythmOptions.intermittent_fasting
      ];

      const merged = Array.from(new Set([...regionalLabels, ...fallbackLabels])).slice(0, 4);
      return [...merged, t.quickStandardRhythm];
    }
    case 'cautions': {
      // 1. Dynamic physical and substance caution tags derived by the regional engine
      const regionalCautionLabels = suggestions
        .filter((s) => s.category === 'physical' || s.category === 'substance')
        .map((s) => formatLifestyleTagLabel(s.label))
        .filter((label) => !activeTagSet.has(label.toLowerCase()));

      // 2. Physical caution fallbacks
      const physicalFallbacks = [pCopy.cautionPresets[0], pCopy.cautionPresets[1]].filter(Boolean);

      // 3. Country-aware substance / smoking fallbacks
      const isUae = countryCode === 'AE';
      const isGccOrArab = ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'EG', 'JO', 'LB', 'IQ', 'SY'].includes(countryCode);

      const substanceFallbacks: string[] = [];
      if (lifestyleProfile?.smokingStatus && lifestyleProfile.smokingStatus !== 'non_smoker') {
        const currentSmokingLabel = pCopy.smokingOptions[lifestyleProfile.smokingStatus];
        if (currentSmokingLabel) substanceFallbacks.push(currentSmokingLabel);
      }

      if (isUae) {
        substanceFallbacks.push(pCopy.smokingOptions.midwakh_dokha, pCopy.smokingOptions.shisha_waterpipe);
      } else if (isGccOrArab) {
        substanceFallbacks.push(pCopy.smokingOptions.shisha_waterpipe, pCopy.smokingOptions.cigarettes);
      } else {
        // Global default (e.g. Sri Lanka / Colombo, UK, US, etc.): never show Midwakh or Shisha by default
        substanceFallbacks.push(pCopy.smokingOptions.cigarettes, pCopy.smokingOptions.vape);
      }

      const merged = Array.from(
        new Set([
          t.quickNoCautions,
          ...regionalCautionLabels,
          ...physicalFallbacks,
          ...substanceFallbacks
        ])
      ).slice(0, 5);

      return merged;
    }
    case 'complete': {
      const hasRamadan = culturalRhythms.includes('ramadan_fasting');
      const actionChips = hasActiveRoutine
        ? [t.quickExploreRoutines, t.quickDone]
        : [t.quickExploreRoutines];

      const changeChips = [
        t.quickChangeSchedule,
        t.quickLowerIntensity,
        t.quickAddCaution,
        hasRamadan ? t.quickAdjustFasting : t.quickChangeRhythm
      ];

      return [...actionChips, ...changeChips];
    }
  }
}
