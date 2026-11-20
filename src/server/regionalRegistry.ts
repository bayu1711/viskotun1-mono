import fs from 'fs';
import path from 'path';
import { isLifestyleCommandOrQuestion } from '../utils/lifestyleInterview';
import type {
  CulturalRhythmId,
  RegionalLifestyleTag,
  UserLifestyleProfile
} from '../types/auth';

const IS_TEST = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
const REGISTRY_FILE = path.join(process.cwd(), '.viskotun1_regional_tags.local.json');

export const PREPOPULATED_REGIONAL_TAGS: Record<string, RegionalLifestyleTag[]> = {
  AE: [
    {
      id: 'tag-ae-ramadan',
      label: 'Ramadan Fasting Observer',
      category: 'culture',
      countryCode: 'AE',
      popularityCount: 980
    },
    {
      id: 'tag-ae-midwakh',
      label: 'Midwakh / Dokha Tobacco',
      category: 'substance',
      countryCode: 'AE',
      popularityCount: 840
    },
    {
      id: 'tag-ae-shisha',
      label: 'Shisha / Waterpipe',
      category: 'substance',
      countryCode: 'AE',
      popularityCount: 790
    },
    {
      id: 'tag-ae-shiftwork',
      label: 'Healthcare Shift Work',
      category: 'schedule',
      countryCode: 'AE',
      popularityCount: 710
    },
    {
      id: 'tag-ae-desksedentary',
      label: 'Desk-bound Sedentary (>8 hrs)',
      category: 'schedule',
      countryCode: 'AE',
      popularityCount: 650
    },
    {
      id: 'tag-ae-gulfheat',
      label: 'Gulf Summer Heat Adaptation',
      category: 'environment',
      countryCode: 'AE',
      popularityCount: 590
    }
  ],
  SA: [
    {
      id: 'tag-sa-ramadan',
      label: 'Ramadan Fasting Observer',
      category: 'culture',
      countryCode: 'SA',
      popularityCount: 950
    },
    {
      id: 'tag-sa-shisha',
      label: 'Shisha / Moassel',
      category: 'substance',
      countryCode: 'SA',
      popularityCount: 780
    },
    {
      id: 'tag-sa-desksedentary',
      label: 'Desk-bound Work',
      category: 'schedule',
      countryCode: 'SA',
      popularityCount: 620
    },
    {
      id: 'tag-sa-summerheat',
      label: 'Extreme Summer Heat',
      category: 'environment',
      countryCode: 'SA',
      popularityCount: 570
    }
  ],
  GB: [
    {
      id: 'tag-gb-sunlight',
      label: 'Low Winter Sunlight / Vit D',
      category: 'environment',
      countryCode: 'GB',
      popularityCount: 820
    },
    {
      id: 'tag-gb-commute',
      label: 'Long Daily Commute',
      category: 'schedule',
      countryCode: 'GB',
      popularityCount: 760
    },
    {
      id: 'tag-gb-caffeine',
      label: 'High Caffeine Dependency',
      category: 'substance',
      countryCode: 'GB',
      popularityCount: 690
    },
    {
      id: 'tag-gb-shiftwork',
      label: 'Shift Work',
      category: 'schedule',
      countryCode: 'GB',
      popularityCount: 610
    },
    {
      id: 'tag-gb-desksedentary',
      label: 'Desk-bound Sedentary',
      category: 'schedule',
      countryCode: 'GB',
      popularityCount: 580
    }
  ],
  US: [
    {
      id: 'tag-us-commute',
      label: 'Long Commute / Remote Work Mix',
      category: 'schedule',
      countryCode: 'US',
      popularityCount: 860
    },
    {
      id: 'tag-us-if',
      label: 'Intermittent Fasting (16:8)',
      category: 'culture',
      countryCode: 'US',
      popularityCount: 810
    },
    {
      id: 'tag-us-ramadan',
      label: 'Ramadan / Periodic Fasting Observer',
      category: 'culture',
      countryCode: 'US',
      popularityCount: 740
    },
    {
      id: 'tag-us-shiftwork',
      label: 'Hospital / Service Shift Work',
      category: 'schedule',
      countryCode: 'US',
      popularityCount: 720
    },
    {
      id: 'tag-us-latedinner',
      label: 'Late Family Dinner (21:00+)',
      category: 'culture',
      countryCode: 'US',
      popularityCount: 650
    }
  ],
  LK: [
    {
      id: 'tag-lk-humidity',
      label: 'Tropical Monsoon Humidity',
      category: 'environment',
      countryCode: 'LK',
      popularityCount: 880
    },
    {
      id: 'tag-lk-earlydawn',
      label: 'Early Dawn Riser',
      category: 'culture',
      countryCode: 'LK',
      popularityCount: 820
    },
    {
      id: 'tag-lk-caffeine',
      label: 'Tea / Caffeine Routine',
      category: 'substance',
      countryCode: 'LK',
      popularityCount: 770
    },
    {
      id: 'tag-lk-transit',
      label: 'Daily Public Transit Commute',
      category: 'schedule',
      countryCode: 'LK',
      popularityCount: 710
    },
    {
      id: 'tag-lk-desksedentary',
      label: 'Desk-bound Work (>8 hrs)',
      category: 'schedule',
      countryCode: 'LK',
      popularityCount: 640
    },
    {
      id: 'tag-lk-joint',
      label: 'Joint & Mobility Sensitivity',
      category: 'physical',
      countryCode: 'LK',
      popularityCount: 610
    },
    {
      id: 'tag-lk-tobacco',
      label: 'Tobacco Tapering',
      category: 'substance',
      countryCode: 'LK',
      popularityCount: 520
    }
  ],
  GLOBAL: [
    {
      id: 'tag-gl-fasting',
      label: 'Intermittent Fasting (16:8)',
      category: 'culture',
      countryCode: 'GLOBAL',
      popularityCount: 920
    },
    {
      id: 'tag-gl-platedinner',
      label: 'Late Family Dinner (21:00+)',
      category: 'culture',
      countryCode: 'GLOBAL',
      popularityCount: 840
    },
    {
      id: 'tag-gl-shiftwork',
      label: 'Rotating Night Shifts',
      category: 'schedule',
      countryCode: 'GLOBAL',
      popularityCount: 810
    },
    {
      id: 'tag-gl-desksedentary',
      label: 'Desk-bound Sedentary',
      category: 'schedule',
      countryCode: 'GLOBAL',
      popularityCount: 790
    },
    {
      id: 'tag-gl-dawn',
      label: 'Early Dawn Riser',
      category: 'culture',
      countryCode: 'GLOBAL',
      popularityCount: 730
    },
    {
      id: 'tag-gl-joint',
      label: 'Joint / Mobility Sensitivity',
      category: 'physical',
      countryCode: 'GLOBAL',
      popularityCount: 680
    },
    {
      id: 'tag-gl-tobacco',
      label: 'Tobacco Tapering',
      category: 'substance',
      countryCode: 'GLOBAL',
      popularityCount: 540
    }
  ]
};

// In-memory crowdsourced tags store
const crowdsourcedTagsMemory = new Map<string, RegionalLifestyleTag[]>();

function loadCrowdsourcedTags(): void {
  if (IS_TEST) return;
  try {
    if (fs.existsSync(REGISTRY_FILE)) {
      const raw = fs.readFileSync(REGISTRY_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (typeof data === 'object' && data !== null) {
        for (const [countryCode, tags] of Object.entries(data)) {
          if (Array.isArray(tags)) {
            crowdsourcedTagsMemory.set(countryCode.toUpperCase(), tags);
          }
        }
      }
    }
  } catch {
    // Fail-safe continue
  }
}

function persistCrowdsourcedTags(): void {
  if (IS_TEST) return;
  try {
    const data: Record<string, RegionalLifestyleTag[]> = {};
    for (const [code, tags] of crowdsourcedTagsMemory.entries()) {
      data[code] = tags;
    }
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Fail-safe continue
  }
}

loadCrowdsourcedTags();

export function getRegionalSuggestions(countryCode: string = 'AE'): RegionalLifestyleTag[] {
  const normCode = countryCode.toUpperCase();
  const presets = PREPOPULATED_REGIONAL_TAGS[normCode] || PREPOPULATED_REGIONAL_TAGS.GLOBAL;
  const crowdsourced = crowdsourcedTagsMemory.get(normCode) || [];

  // Combine and sort by popularity
  const map = new Map<string, RegionalLifestyleTag>();
  for (const tag of presets) {
    map.set(tag.label.toLowerCase(), tag);
  }
  for (const tag of crowdsourced) {
    const key = tag.label.toLowerCase();
    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.popularityCount += tag.popularityCount;
    } else {
      map.set(key, tag);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.popularityCount - a.popularityCount);
}

export function recordCrowdsourcedTag(
  countryCode: string,
  rawLabel: string,
  category: RegionalLifestyleTag['category'] = 'schedule'
): RegionalLifestyleTag {
  const normCode = countryCode.toUpperCase();
  const cleanLabel = rawLabel.trim();
  const existingList = crowdsourcedTagsMemory.get(normCode) || [];

  const foundIndex = existingList.findIndex((t) => t.label.toLowerCase() === cleanLabel.toLowerCase());
  let tag: RegionalLifestyleTag;

  if (foundIndex >= 0) {
    existingList[foundIndex].popularityCount += 1;
    tag = existingList[foundIndex];
  } else {
    tag = {
      id: `crowd-${normCode.toLowerCase()}-${Date.now()}`,
      label: cleanLabel,
      category,
      countryCode: normCode,
      popularityCount: 1
    };
    existingList.push(tag);
  }

  crowdsourcedTagsMemory.set(normCode, existingList);
  persistCrowdsourcedTags();
  return tag;
}

export interface LifestyleParseResult {
  reply: string;
  profileUpdates: Partial<UserLifestyleProfile>;
  extractedTags: string[];
  newCrowdsourcedTags?: string[];
}

/**
 * Deterministic clinical lifestyle parser with zero hallucination fallback
 */
export function parseLifestyleDeterministically(
  message: string,
  currentProfile?: Partial<UserLifestyleProfile>
): LifestyleParseResult {
  const text = message.toLowerCase();
  const extractedTags: string[] = [];
  const profileUpdates: Partial<UserLifestyleProfile> = {
    intakeCompleted: true
  };
  const explanations: string[] = [];

  // 1. Shift work / night shift
  if (text.includes('shift') || text.includes('night') || text.includes('rotating') || text.includes('icu') || text.includes('hospital')) {
    profileUpdates.workPattern = 'shift_work';
    extractedTags.push('Shift Work / Night Shifts');
    explanations.push('Routine notifications & session pacing shifted to your waking window');
  } else if (text.includes('desk') || text.includes('sitting') || text.includes('sedentary') || text.includes('office') || text.includes('screen')) {
    profileUpdates.workPattern = 'desk_sedentary';
    extractedTags.push('Desk-bound Sedentary');
    explanations.push('Integrated 90-second postural micro-breaks during working hours');
  } else if (text.includes('travel') || text.includes('flight') || text.includes('commute')) {
    profileUpdates.workPattern = 'frequent_travel';
    extractedTags.push('Frequent Travel');
    explanations.push('Hotel-friendly bodyweight variations enabled');
  }

  // 2. Tobacco / Nicotine (check non-smoker / former smoker first to avoid false-positive on 'smoke')
  if (
    text.includes('non-smoker') ||
    text.includes('nonsmoker') ||
    text.includes("don't smoke") ||
    text.includes('do not smoke') ||
    text.includes('never smoke') ||
    text.includes('no smoking')
  ) {
    profileUpdates.smokingStatus = 'non_smoker';
    extractedTags.push('Non-Smoker');
    explanations.push('Standard non-smoker tissue healing velocity applied');
  } else if (
    text.includes('former smoker') ||
    text.includes('ex-smoker') ||
    text.includes('quit smoking') ||
    text.includes('stopped smoking')
  ) {
    profileUpdates.smokingStatus = 'former_smoker';
    extractedTags.push('Former Smoker');
    explanations.push('Vascular tone recovery metrics calibrated for cessation recovery');
  } else if (text.includes('dokha') || text.includes('midwakh') || text.includes('medwakh')) {
    profileUpdates.smokingStatus = 'midwakh_dokha';
    extractedTags.push('Midwakh / Dokha Tobacco');
    explanations.push('Cardiorespiratory recovery parameters adjusted for episodic nicotine elevation');
  } else if (text.includes('shisha') || text.includes('hookah') || text.includes('waterpipe') || text.includes('nargile') || text.includes('moassel')) {
    profileUpdates.smokingStatus = 'shisha_waterpipe';
    extractedTags.push('Shisha / Waterpipe');
    explanations.push('Aerobic capacity recovery baseline calibrated for waterpipe tobacco use');
  } else if (text.includes('cig') || text.includes('smoke') || text.includes('smoking')) {
    profileUpdates.smokingStatus = 'cigarettes';
    extractedTags.push('Cigarettes');
    explanations.push('Tissue oxygenation trajectory adjusted for smoking cohort telemetry');
  } else if (text.includes('vape') || text.includes('e-cig') || text.includes('juul')) {
    profileUpdates.smokingStatus = 'vape';
    extractedTags.push('Vape / E-cigarette');
    explanations.push('Vascular tone recovery metrics calibrated');
  }

  // 3. Diverse cultural, fasting & household meal rhythms (country-independent)
  const detectedRhythms = new Set<CulturalRhythmId>(currentProfile?.culturalRhythms ?? []);
  if (text.includes('ramadan') || text.includes('suhoor') || text.includes('iftar')) {
    profileUpdates.isRamadanFastingObserver = true;
    detectedRhythms.add('ramadan_fasting');
    extractedTags.push('Ramadan Fasting Observer');
    explanations.push('Nutrition and hydration steps shifted to post-Iftar hours');
  } else if (text.includes('intermittent') || text.includes('16:8') || text.includes('omad')) {
    detectedRhythms.add('intermittent_fasting');
    extractedTags.push('Intermittent Fasting (16:8)');
    explanations.push('Electrolyte hydration paired smoothly with your eating window');
  } else if (text.includes('lent') || text.includes('ekadashi') || text.includes('fasting')) {
    detectedRhythms.add('periodic_religious_fasting');
    extractedTags.push('Periodic Fasting');
    explanations.push('Gentle load pacing and hydration adjusted for fasting periods');
  }

  if (text.includes('late dinner') || text.includes('late meal') || text.includes('21:00') || text.includes('22:00')) {
    detectedRhythms.add('late_family_dinner');
    extractedTags.push('Late Family Dinner (21:00+)');
    explanations.push('Movement and sleep wind-down spaced comfortably around late evening meals');
  }
  if (text.includes('dawn') || text.includes('fajr') || text.includes('5 am') || text.includes('early riser')) {
    detectedRhythms.add('early_dawn_riser');
    extractedTags.push('Early Dawn Riser');
    explanations.push('Primary routine window anchored smoothly after early morning waking');
  }
  if (text.includes('siesta') || text.includes('midday rest') || text.includes('afternoon nap')) {
    detectedRhythms.add('midday_siesta_rest');
    extractedTags.push('Midday Rest / Siesta');
    explanations.push('Pacing split cleanly before or after your midday rest window');
  }
  if (text.includes('sabbath') || text.includes('shabbat') || text.includes('sunday rest')) {
    detectedRhythms.add('sabbath_weekly_rest');
    extractedTags.push('Weekly Rest / Sabbath');
    explanations.push('Weekly recovery day preserved cleanly inside overall trial adherence');
  }
  if (text.includes('multi-generational') || text.includes('shared household') || text.includes('extended family')) {
    detectedRhythms.add('collectivist_household');
    extractedTags.push('Shared Household Schedule');
    explanations.push('Compact home-friendly intervals tailored for busy shared households');
  }

  if (detectedRhythms.size > 0) {
    profileUpdates.culturalRhythms = Array.from(detectedRhythms);
  }

  // 4. Summer heat / Climate
  if (
    text.includes('heat') ||
    text.includes('summer') ||
    (text.includes('sun') && !text.includes('sunset') && !text.includes('sunday')) ||
    (text.includes('hot') && !text.includes('hotel') && !text.includes('photo'))
  ) {
    profileUpdates.climateSensitivity = 'summer_heat';
    extractedTags.push('Summer Heat Adaptation');
    explanations.push('Indoor climate-controlled execution recommended for high temperature days');
  }

  // 5. Physical sensitivities
  if (text.includes('knee') || text.includes('back') || text.includes('joint') || text.includes('ache') || text.includes('pain') || text.includes('sore')) {
    const caution = text.includes('knee') ? 'Knee sensitivity' : text.includes('back') ? 'Lower back sensitivity' : 'Joint caution';
    profileUpdates.physicalCautions = [caution];
    extractedTags.push(caution);
    explanations.push(`Progression ramp-up cushioned for ${caution.toLowerCase()}`);
  }

  // 6. Intensity / pacing reduction (lower intensity / micro-dose)
  if (
    text.includes('lower intensity') ||
    text.includes('gentle') ||
    text.includes('micro') ||
    text.includes('reduce load') ||
    text.includes('lighter pace') ||
    text.includes('easier') ||
    text.includes('تخفيف')
  ) {
    extractedTags.push('Gentle / Micro Pacing');
    explanations.push('Routine calibrated to gentle micro-dosing to protect recovery and keep adherence effortless');
  }

  // Fallback if no specific keyword matched — only capture as custom tag if it looks like a personal habit
  if (extractedTags.length === 0) {
    const isCommand = isLifestyleCommandOrQuestion(message);
    if (!isCommand && message.trim().length <= 48) {
      const customTag = message.trim();
      extractedTags.push(customTag);
      explanations.push('Context noted and saved to personal participant profile');
    }
  }

  const combinedTags = Array.from(new Set([...(currentProfile?.activeTags || []), ...extractedTags]));
  profileUpdates.activeTags = combinedTags;

  const reply =
    explanations.length > 0
      ? `Noted! ${explanations.join('. ')}. Your daily routine is tailored to your real-world circumstances.`
      : 'Noted! Your profile preferences have been updated.';

  return {
    reply,
    profileUpdates,
    extractedTags
  };
}
