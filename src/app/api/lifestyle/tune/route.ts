import { NextResponse } from 'next/server';
import { getRequestUser } from '../../../../server/auth';
import { enforceRateLimit } from '../../../../server/rateLimit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getLocaleCopy } from '../../../../data/locales';
import type { AppLocale } from '../../../../data/locales/types';
import { executeWithGeminiFailover, getGeminiApiKeys } from '../../../../server/geminiKeys';
import { deriveGlobalRegionalSuggestions } from '../../../../server/lifestyleEngine';
import { validateRegionalTagsWithGuardrails } from '../../../../server/lifestyleGuardrails';
import {
  getRegionalSuggestions,
  parseLifestyleDeterministically,
  recordCrowdsourcedTag
} from '../../../../server/regionalRegistry';
import type { CulturalRhythmId, RegionContext, UserLifestyleProfile, UserProfile } from '../../../../types/auth';
import type { AIEngineType } from '../../../../types/routine';
import { resolveCountryName } from '../../../../utils/geo';
import {
  buildConversationalLifestyleReply,
  buildProfileUpdatesFromParse,
  computeNextInterviewStage,
  formatRegionLabel,
  getStageQuestion,
  isLifestyleCommandOrQuestion,
  type LifestyleInterviewStage,
  parseConversationalLifestyleAnswer
} from '../../../../utils/lifestyleInterview';
import {
  CULTURAL_RHYTHM_KEYS,
  coerceAvailableWindows,
  deriveClinicalFocus,
  normalizePhysicalCautions,
  sanitizeAge,
  sanitizeLifestyleFields,
  syncLifestyleActiveTags
} from '../../../../utils/profile';
import { normalizeAvailableWindows } from '../../../../utils/schedule';

const VALID_RHYTHMS = new Set<string>(CULTURAL_RHYTHM_KEYS);
const INTERVIEW_STAGES = new Set<LifestyleInterviewStage>([
  'region',
  'age',
  'availability',
  'age_time',
  'rhythm',
  'cautions',
  'complete'
]);

function parseRhythmsParam(raw: string | null): CulturalRhythmId[] | undefined {
  if (!raw) return undefined;
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is CulturalRhythmId => VALID_RHYTHMS.has(s));
  return list.length > 0 ? list : undefined;
}

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  const limited = enforceRateLimit('lifestyle', request, user);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const country = (searchParams.get('country') || 'AE').slice(0, 8);
  const countryName = searchParams.get('countryName')?.slice(0, 80) || undefined;
  const city = searchParams.get('city')?.slice(0, 80) || undefined;
  const culturalRhythms = parseRhythmsParam(searchParams.get('rhythms'));

  const { suggestions, source } = await deriveGlobalRegionalSuggestions({
    countryCode: country,
    countryName,
    city,
    culturalRhythms
  });
  return NextResponse.json({ country, countryName, city, source, suggestions });
}

const MAX_MESSAGE_LENGTH = 2_000;

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  const limited = enforceRateLimit('lifestyle', request, user);
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.message !== 'string' || !body.message.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }
    if (body.message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `Message is too long. Keep it under ${MAX_MESSAGE_LENGTH} characters.` }, { status: 400 });
    }

    const {
      message,
      country = '',
      currentProfile,
      userProfile,
      interviewStage,
      answeredStages,
      activeRoutineTitle,
      locale = 'en'
    }: {
      message: string;
      country?: string;
      currentProfile?: Partial<UserLifestyleProfile>;
      userProfile?: Partial<UserProfile>;
      interviewStage?: LifestyleInterviewStage;
      answeredStages?: LifestyleInterviewStage[];
      activeRoutineTitle?: string;
      locale?: AppLocale;
    } = body;

    const safeLocale: AppLocale = locale === 'ar' ? 'ar' : 'en';
    const localeCopy = getLocaleCopy(safeLocale);
    const currentRegion: RegionContext = currentProfile?.region ?? {
      countryCode: country,
      countryName: country ? resolveCountryName(country) : '',
      detectedBy: 'default_global',
      confirmed: false
    };

    const isGuidedConversationTurn =
      interviewStage !== undefined &&
      INTERVIEW_STAGES.has(interviewStage) &&
      interviewStage !== 'complete';

    if (isGuidedConversationTurn) {
      const parsed = parseConversationalLifestyleAnswer(message, interviewStage, {
        currentRegion,
        currentProfile,
        currentUserProfile: userProfile
      });

      const answeredSet = new Set<LifestyleInterviewStage>(
        Array.isArray(answeredStages) ? answeredStages : []
      );
      const { nextStage, updatedAnswered } = computeNextInterviewStage(
        interviewStage,
        parsed,
        answeredSet
      );

      const { profileUpdates, userProfileUpdates, suggestedFocus } = buildProfileUpdatesFromParse(
        parsed,
        nextStage,
        currentProfile,
        userProfile,
        activeRoutineTitle
      );

      const resolvedRegion = profileUpdates.region ?? currentRegion;
      const resolvedRegionLabel = formatRegionLabel(resolvedRegion);
      let reply = buildConversationalLifestyleReply({
        parsed,
        nextStage,
        regionLabel: resolvedRegionLabel,
        suggestedFocus,
        copy: localeCopy,
        locale: safeLocale
      });
      let engine: AIEngineType = 'local-rules';

      const keys = getGeminiApiKeys();
      const replyPromise = (async (): Promise<{ reply: string; engine: AIEngineType } | null> => {
        if (keys.length === 0) return null;
        try {
          const nextQuestion = getStageQuestion(nextStage, resolvedRegionLabel, localeCopy, {
            suggestedFocus
          });
          const languageInstruction =
            safeLocale === 'ar'
              ? 'Reply strictly in natural, warm Modern Standard Arabic.'
              : 'Reply in plain, warm English.';

          const prompt = `You are N1 AI, TrialN1's calm, friendly clinical habit-formation companion having a natural back-and-forth conversation to personalize a participant's daily health routine.
${languageInstruction}
Current topic just answered: ${interviewStage}
Participant's reply: "${message}"
Extracted updates: ${JSON.stringify({
            region: profileUpdates.region,
            age: userProfileUpdates.age,
            availabilityMode: userProfileUpdates.availabilityMode,
            availableWindows: userProfileUpdates.availableWindows,
            workPattern: profileUpdates.workPattern,
            climateSensitivity: profileUpdates.climateSensitivity,
            culturalRhythms: profileUpdates.culturalRhythms,
            smokingStatus: profileUpdates.smokingStatus,
            physicalCautions: profileUpdates.physicalCautions
          })}
Next conversation stage: ${nextStage}
${
  nextStage === 'complete'
    ? `Derived focus to summarize warmly: "${suggestedFocus}"`
    : `Next question to ask naturally: "${nextQuestion}"`
}

Rules:
1. Keep it concise: 1-2 short sentences, plain prose, no bullet lists, no headers, no hype, no medical disclaimers.
2. Briefly acknowledge what the participant just shared without judgment.
3. Only say the app adapts timing, pacing, rest and safety cautions. Never claim it measures heart rate, sets medication or dosage, diagnoses, or treats anything.
4. ${
            nextStage === 'complete'
              ? 'Warmly confirm their adaptive profile is ready, state their derived focus in plain language, and recommend exploring routines tailored to their focus.'
              : 'Naturally ask the next question above so the conversation flows smoothly.'
          }`;

          const geminiReply = await executeWithGeminiFailover(async (apiKey) => {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
              model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
            });
            const res = await model.generateContent(prompt);
            return res.response.text().trim();
          }, 8000);

          if (geminiReply) {
            return { reply: geminiReply, engine: 'cloud-gemini' };
          }
        } catch (err) {
          console.warn('[LifestyleTuneAPI] Gemini interview reply failed, using deterministic response:', err);
        }
        return null;
      })();

      const suggestionsPromise = deriveGlobalRegionalSuggestions({
        countryCode: resolvedRegion.countryCode,
        countryName: resolvedRegion.countryName,
        city: resolvedRegion.city,
        culturalRhythms: profileUpdates.culturalRhythms ?? currentProfile?.culturalRhythms
      }).catch((err) => {
        console.warn('[LifestyleTuneAPI] Secondary suggestions failed, using registry fallback:', err);
        return {
          suggestions: getRegionalSuggestions(resolvedRegion.countryCode),
          source: 'registry-fallback' as const
        };
      });

      const [aiReplyResult, suggestionsResult] = await Promise.all([replyPromise, suggestionsPromise]);

      if (aiReplyResult) {
        reply = aiReplyResult.reply;
        engine = aiReplyResult.engine;
      }

      const safeTags = validateRegionalTagsWithGuardrails(
        parsed.extractedTags.map((label) => ({ label })),
        resolvedRegion.countryCode
      );
      for (const tag of safeTags) {
        recordCrowdsourcedTag(resolvedRegion.countryCode, tag.label, tag.category);
      }

      return NextResponse.json({
        reply,
        engine,
        profileUpdates,
        userProfileUpdates,
        extractedTags: safeTags.map((t) => t.label),
        suggestedFocus,
        suggestions: suggestionsResult.suggestions,
        nextStage,
        answeredStages: updatedAnswered
      });
    }

    // Ongoing free-form lifestyle tuning (post-onboarding or direct API call)
    const deterministicResult = parseLifestyleDeterministically(message, currentProfile);
    const conversationalExtra = parseConversationalLifestyleAnswer(message, 'complete', {
      currentRegion,
      currentProfile,
      currentUserProfile: userProfile
    });

    const mergedProfileUpdates: Partial<UserLifestyleProfile> = {
      ...deterministicResult.profileUpdates,
      ...(conversationalExtra.region ? { region: conversationalExtra.region } : {})
    };
    // Cautions accumulate; a new message never silently drops an earlier caution.
    const existingCautions = currentProfile?.physicalCautions ?? [];
    const turnCautions = [
      ...(deterministicResult.profileUpdates.physicalCautions ?? []),
      ...(conversationalExtra.physicalCautions ?? [])
    ];
    if (turnCautions.length > 0) {
      mergedProfileUpdates.physicalCautions = normalizePhysicalCautions([
        ...existingCautions,
        ...turnCautions
      ]);
    }

    const userProfileUpdates: Partial<UserProfile> = {
      ...(conversationalExtra.age !== undefined ? { age: conversationalExtra.age } : {}),
      ...(conversationalExtra.availabilityMode
        ? { availabilityMode: conversationalExtra.availabilityMode }
        : {}),
      ...(conversationalExtra.availableWindows && conversationalExtra.availableWindows.length > 0
        ? { availableWindows: conversationalExtra.availableWindows }
        : {})
    };

    // If deterministic parsing updated the region, formulate a concise acknowledgment
    if (conversationalExtra.region) {
      const regionLabel = formatRegionLabel(conversationalExtra.region);
      deterministicResult.reply = localeCopy.lifestyleTuning.regionUpdatedReply(regionLabel);
    }

    let resolvedCountry = mergedProfileUpdates.region?.countryCode || country;
    let engine: AIEngineType = 'local-rules';

    // AI-First Semantic Extraction (Add Paper & Ask parity): when Gemini is available, understand intent & extract structured JSON
    const keys = getGeminiApiKeys();
    if (keys.length > 0) {
      try {
        const languageInstruction =
          safeLocale === 'ar'
            ? 'Reply strictly in warm, concise Modern Standard Arabic.'
            : 'Reply in warm, concise English.';

        const prompt = `You are N1 AI, TrialN1's clinical habit-formation and research adherence companion.
A participant provided this natural language message to configure or update their profile/routine:
"${message}"

Current Context:
- Region: ${JSON.stringify(currentRegion)}
- Age: ${userProfile?.age ?? 'unset'}
- Availability: ${userProfile?.availabilityMode ?? 'unset'}
- Active lifestyle factors: ${JSON.stringify(currentProfile?.activeTags ?? [])}

Task:
Analyze their semantic intent and extract structured updates.
Output strictly JSON matching this schema:
{
  "region": {
    "countryCode": string | null,
    "countryName": string | null,
    "city": string | null
  } | null,
  "age": number | null,
  "availabilityMode": "windows" | "anytime" | null,
  "availableWindows": [{"start": "HH:mm", "end": "HH:mm"}] | null,
  "workPattern": "standard" | "shift_work" | "desk_sedentary" | "frequent_travel" | "flexible" | null,
  "activityBaseline": "sedentary" | "light" | "moderate" | "active" | null,
  "climateSensitivity": "summer_heat" | "moderate" | "cold_climate" | null,
  "smokingStatus": "non_smoker" | "former_smoker" | "cigarettes" | "midwakh_dokha" | "shisha_waterpipe" | "vape" | "other" | null,
  "isRamadanFastingObserver": boolean | null,
  "culturalRhythms": (${CULTURAL_RHYTHM_KEYS.map((k) => `"${k}"`).join(' | ')})[] | null,
  "physicalCautions": string[] | null,
  "lifestyleTags": string[] | null,
  "reply": string
}

Guidelines:
1. If the user asks to change, set, or update their region/location (e.g. "change my region to colombo sri lanka"), extract city, countryName, and countryCode into "region".
2. If the user mentions age or available schedule windows, extract them. Times are 24-hour "HH:mm".
3. If the user mentions work pattern, activity level, smoking, climate, or injuries/cautions, extract them. Use only the listed enum values.
4. "physicalCautions": short labels for NEW cautions only. Prefer these exact labels when they fit: "Morning stiffness", "Knee sensitivity", "Lower back sensitivity", "Shoulder mobility limit", "Ankle / Achilles tenderness", "Hip stiffness", "Neck tension", "Wrist sensitivity", "Joint sensitivity", "Heat fatigue".
5. "lifestyleTags": ONLY specific personal habits that no field above covers (e.g. "Gym after work"). NEVER repeat work, smoking, climate, rhythm or caution values, and NEVER include commands or questions.
6. In "reply", write a natural 1-2 sentence response explaining how their routine adapts without judgment. Only say the app adapts timing, pacing, rest and safety cautions; never claim it measures vitals, sets medication or dosage, or diagnoses. ${languageInstruction}`;

        const geminiJson = await executeWithGeminiFailover(async (apiKey) => {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
            generationConfig: {
              responseMimeType: 'application/json'
            }
          });
          const res = await model.generateContent(prompt);
          return res.response.text().trim();
        });

        if (geminiJson) {
          try {
            const cleanJson = geminiJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (parsed.region && (parsed.region.city || parsed.region.countryCode || parsed.region.countryName)) {
              const countryCode = parsed.region.countryCode || currentRegion.countryCode;
              const countryName = parsed.region.countryName || (countryCode ? resolveCountryName(countryCode) : currentRegion.countryName);
              mergedProfileUpdates.region = {
                countryCode,
                countryName,
                city: parsed.region.city || undefined,
                detectedBy: 'user_selected',
                confirmed: true
              };
              resolvedCountry = countryCode;
            }
            // Same age bounds as the /profile age field.
            const geminiAge = sanitizeAge(typeof parsed.age === 'number' ? parsed.age : undefined);
            if (geminiAge !== undefined) {
              userProfileUpdates.age = geminiAge;
            }
            if (parsed.availabilityMode === 'windows' || parsed.availabilityMode === 'anytime') {
              userProfileUpdates.availabilityMode = parsed.availabilityMode;
            }
            const geminiWindows = normalizeAvailableWindows(
              coerceAvailableWindows(parsed.availableWindows)
            );
            if (geminiWindows.length > 0) {
              userProfileUpdates.availableWindows = geminiWindows;
              userProfileUpdates.availabilityMode = 'windows';
            }
            // Drop any enum value the /profile form cannot display.
            const { physicalCautions: geminiCautions, ...geminiFields } = sanitizeLifestyleFields(parsed);
            Object.assign(mergedProfileUpdates, geminiFields);
            if (geminiCautions && geminiCautions.length > 0) {
              mergedProfileUpdates.physicalCautions = normalizePhysicalCautions([
                ...(mergedProfileUpdates.physicalCautions ?? existingCautions),
                ...geminiCautions
              ]);
            }
            if (Array.isArray(parsed.lifestyleTags) && parsed.lifestyleTags.length > 0) {
              const safeCustom = parsed.lifestyleTags.filter(
                (t: string) => typeof t === 'string' && !isLifestyleCommandOrQuestion(t) && t.trim().length <= 48
              );
              mergedProfileUpdates.activeTags = Array.from(
                new Set([...(currentProfile?.activeTags || []), ...safeCustom])
              );
            }
            if (parsed.reply && typeof parsed.reply === 'string') {
              deterministicResult.reply = parsed.reply;
            }
            engine = 'cloud-gemini';
          } catch (jsonErr) {
            console.warn('[LifestyleTuneAPI] Failed to parse Gemini extraction JSON:', jsonErr);
          }
        }
      } catch (err) {
        console.warn('[LifestyleTuneAPI] Gemini call failed, using deterministic response:', err);
      }
    }

    // Record validated crowdsourced tags to the regional registry
    const safeTags = validateRegionalTagsWithGuardrails(
      deterministicResult.extractedTags.map((label) => ({ label })),
      resolvedCountry
    );
    for (const tag of safeTags) {
      recordCrowdsourcedTag(resolvedCountry, tag.label, tag.category);
    }

    let updatedSuggestions = getRegionalSuggestions(resolvedCountry);
    try {
      const res = await deriveGlobalRegionalSuggestions({
        countryCode: resolvedCountry,
        countryName: mergedProfileUpdates.region?.countryName ?? currentProfile?.region?.countryName,
        city: mergedProfileUpdates.region?.city ?? currentProfile?.region?.city,
        culturalRhythms: mergedProfileUpdates.culturalRhythms ?? currentProfile?.culturalRhythms
      });
      if (res && res.suggestions && res.suggestions.length > 0) {
        updatedSuggestions = res.suggestions;
      }
    } catch (err) {
      console.warn('[LifestyleTuneAPI] Secondary suggestions failed, using registry fallback:', err);
    }
    // Recompute tags from the merged fields so chips match /profile and stale copies drop.
    mergedProfileUpdates.activeTags = syncLifestyleActiveTags({
      ...currentProfile,
      ...mergedProfileUpdates,
      activeTags: mergedProfileUpdates.activeTags ?? currentProfile?.activeTags
    });
    const mergedProfile: Partial<UserLifestyleProfile> = {
      ...currentProfile,
      ...mergedProfileUpdates
    };
    const suggestedFocus = deriveClinicalFocus(mergedProfile, {
      age: userProfileUpdates.age ?? userProfile?.age,
      routineTitle: activeRoutineTitle
    });

    return NextResponse.json({
      reply: deterministicResult.reply,
      engine,
      profileUpdates: mergedProfileUpdates,
      userProfileUpdates,
      extractedTags: safeTags.map((t) => t.label),
      suggestedFocus,
      suggestions: updatedSuggestions,
      nextStage: 'complete' as LifestyleInterviewStage
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
