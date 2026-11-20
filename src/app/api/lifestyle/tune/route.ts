import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getLocaleCopy } from '../../../../data/locales';
import type { AppLocale } from '../../../../data/locales/types';
import { executeWithGeminiFailover, getGeminiApiKeys } from '../../../../server/geminiKeys';
import { deriveGlobalRegionalSuggestions } from '../../../../server/lifestyleEngine';
import { validateRegionalTagsWithGuardrails } from '../../../../server/lifestyleGuardrails';
import {
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
import { CULTURAL_RHYTHM_KEYS, deriveClinicalFocus } from '../../../../utils/profile';

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
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country') || 'AE';
  const countryName = searchParams.get('countryName') || undefined;
  const city = searchParams.get('city') || undefined;
  const culturalRhythms = parseRhythmsParam(searchParams.get('rhythms'));

  const { suggestions, source } = await deriveGlobalRegionalSuggestions({
    countryCode: country,
    countryName,
    city,
    culturalRhythms
  });
  return NextResponse.json({ country, countryName, city, source, suggestions });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
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
      if (keys.length > 0) {
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
3. ${
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
          });

          if (geminiReply) {
            reply = geminiReply;
            engine = 'cloud-gemini';
          }
        } catch (err) {
          console.warn('[LifestyleTuneAPI] Gemini interview reply failed, using deterministic response:', err);
        }
      }

      const safeTags = validateRegionalTagsWithGuardrails(
        parsed.extractedTags.map((label) => ({ label })),
        resolvedRegion.countryCode
      );
      for (const tag of safeTags) {
        recordCrowdsourcedTag(resolvedRegion.countryCode, tag.label, tag.category);
      }

      const { suggestions: updatedSuggestions } = await deriveGlobalRegionalSuggestions({
        countryCode: resolvedRegion.countryCode,
        countryName: resolvedRegion.countryName,
        city: resolvedRegion.city,
        culturalRhythms: profileUpdates.culturalRhythms ?? currentProfile?.culturalRhythms
      });

      return NextResponse.json({
        reply,
        engine,
        profileUpdates,
        userProfileUpdates,
        extractedTags: safeTags.map((t) => t.label),
        suggestedFocus,
        suggestions: updatedSuggestions,
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
      ...(conversationalExtra.region ? { region: conversationalExtra.region } : {}),
      ...(conversationalExtra.physicalCautions
        ? { physicalCautions: conversationalExtra.physicalCautions }
        : {})
    };

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
      deterministicResult.reply = `Region updated to ${regionLabel}. Your daily routine and pacing now adapt to your local climate and regional patterns.`;
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
  "availableWindows": [{"start": number, "end": number}] | null,
  "workPattern": "shift_work" | "desk_sedentary" | "frequent_travel" | "standard" | null,
  "climateSensitivity": "summer_heat" | "high_humidity" | "winter_cold" | "moderate" | null,
  "smokingStatus": "non_smoker" | "former_smoker" | "cigarettes" | "midwakh_dokha" | "shisha_waterpipe" | "vape" | null,
  "isRamadanFastingObserver": boolean | null,
  "culturalRhythms": string[] | null,
  "physicalCautions": string[] | null,
  "lifestyleTags": string[] | null,
  "reply": string
}

Guidelines:
1. If the user asks to change, set, or update their region/location (e.g. "change my region to colombo sri lanka"), extract city, countryName, and countryCode into "region".
2. If the user mentions age or available schedule windows, extract them.
3. If the user mentions work pattern, smoking, climate sensitivity, or injuries/cautions, extract them.
4. "lifestyleTags": ONLY include specific personal daily habits (e.g. "Early Dawn Riser"), NEVER action commands or questions.
5. In "reply", write a natural 1-2 sentence response explaining how their routine adapts without judgment. ${languageInstruction}`;

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
            if (typeof parsed.age === 'number' && Number.isFinite(parsed.age) && parsed.age >= 10 && parsed.age <= 120) {
              userProfileUpdates.age = parsed.age;
            }
            if (parsed.availabilityMode === 'windows' || parsed.availabilityMode === 'anytime') {
              userProfileUpdates.availabilityMode = parsed.availabilityMode;
            }
            if (Array.isArray(parsed.availableWindows) && parsed.availableWindows.length > 0) {
              userProfileUpdates.availableWindows = parsed.availableWindows;
              userProfileUpdates.availabilityMode = 'windows';
            }
            if (parsed.workPattern) mergedProfileUpdates.workPattern = parsed.workPattern;
            if (parsed.climateSensitivity) mergedProfileUpdates.climateSensitivity = parsed.climateSensitivity;
            if (parsed.smokingStatus) mergedProfileUpdates.smokingStatus = parsed.smokingStatus;
            if (typeof parsed.isRamadanFastingObserver === 'boolean') {
              mergedProfileUpdates.isRamadanFastingObserver = parsed.isRamadanFastingObserver;
            }
            if (Array.isArray(parsed.culturalRhythms) && parsed.culturalRhythms.length > 0) {
              mergedProfileUpdates.culturalRhythms = parsed.culturalRhythms;
            }
            if (Array.isArray(parsed.physicalCautions) && parsed.physicalCautions.length > 0) {
              mergedProfileUpdates.physicalCautions = parsed.physicalCautions;
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

    const { suggestions: updatedSuggestions } = await deriveGlobalRegionalSuggestions({
      countryCode: resolvedCountry,
      countryName: mergedProfileUpdates.region?.countryName ?? currentProfile?.region?.countryName,
      city: mergedProfileUpdates.region?.city ?? currentProfile?.region?.city,
      culturalRhythms: mergedProfileUpdates.culturalRhythms ?? currentProfile?.culturalRhythms
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
