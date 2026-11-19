import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getLocaleCopy } from '@/data/locales';
import type { AppLocale } from '@/data/locales/types';
import { executeWithGeminiFailover, getGeminiApiKeys } from '@/server/geminiKeys';
import { deriveGlobalRegionalSuggestions } from '@/server/lifestyleEngine';
import { validateRegionalTagsWithGuardrails } from '@/server/lifestyleGuardrails';
import {
  parseLifestyleDeterministically,
  recordCrowdsourcedTag
} from '@/server/regionalRegistry';
import type { CulturalRhythmId, RegionContext, UserLifestyleProfile, UserProfile } from '@/types/auth';
import type { AIEngineType } from '@/types/routine';
import { resolveCountryName } from '@/utils/geo';
import {
  buildConversationalLifestyleReply,
  buildProfileUpdatesFromParse,
  computeNextInterviewStage,
  formatRegionLabel,
  getStageQuestion,
  type LifestyleInterviewStage,
  parseConversationalLifestyleAnswer
} from '@/utils/lifestyleInterview';
import { CULTURAL_RHYTHM_KEYS, deriveClinicalFocus } from '@/utils/profile';

const VALID_RHYTHMS = new Set<string>(CULTURAL_RHYTHM_KEYS);
const INTERVIEW_STAGES = new Set<LifestyleInterviewStage>([
  'region',
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
      country = 'AE',
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
      countryName: resolveCountryName(country),
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

          const prompt = `You are TrialN1, a calm, friendly clinical habit-formation companion having a natural back-and-forth conversation to personalize a participant's daily health routine.
${languageInstruction}
Current topic just answered: ${interviewStage}
Participant's reply: "${message}"
Extracted updates: ${JSON.stringify({
            region: profileUpdates.region,
            age: userProfileUpdates.age,
            preferredReminderTime: userProfileUpdates.preferredReminderTime,
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
              ? 'Warmly confirm their adaptive profile is ready and state their derived focus in plain language.'
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
      ...(conversationalExtra.preferredReminderTime
        ? { preferredReminderTime: conversationalExtra.preferredReminderTime }
        : {})
    };

    const resolvedCountry = mergedProfileUpdates.region?.countryCode || country;
    let engine: AIEngineType = 'local-rules';

    // If Gemini keys are available, enhance reply with Gemini
    const keys = getGeminiApiKeys();
    if (keys.length > 0) {
      try {
        const languageInstruction =
          safeLocale === 'ar'
            ? 'Reply in warm, concise Modern Standard Arabic.'
            : 'Reply in warm, concise English.';
        const prompt = `You are TrialN1, a clinical habit-formation and research adherence companion.
${languageInstruction}
A user tracking an interventional clinical routine in ${resolvedCountry} just provided their daily schedule, habits, or constraints:
"${message}"

Extracted structured factors:
${JSON.stringify({ ...mergedProfileUpdates, ...userProfileUpdates })}

Task:
Respond in 2-3 warm, professional sentences (like an expert physiotherapist or clinical trial coordinator):
1. Acknowledge their specific constraints (e.g., shift work, Dokha/shisha, fasting, sedentary office work, location or reminder time changes).
2. Plainly explain how their routine pacing, timing windows, or recovery tracking are adapted without any judgment or guilt.
3. Keep it concise, friendly, and empowering.`;

        const geminiReply = await executeWithGeminiFailover(async (apiKey) => {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
          const res = await model.generateContent(prompt);
          return res.response.text().trim();
        });

        if (geminiReply) {
          deterministicResult.reply = geminiReply;
          engine = 'cloud-gemini';
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
