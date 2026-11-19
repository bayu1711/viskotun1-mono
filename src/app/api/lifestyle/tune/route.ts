import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { executeWithGeminiFailover, getGeminiApiKeys } from '@/server/geminiKeys';
import { deriveGlobalRegionalSuggestions } from '@/server/lifestyleEngine';
import { validateRegionalTagsWithGuardrails } from '@/server/lifestyleGuardrails';
import {
  parseLifestyleDeterministically,
  recordCrowdsourcedTag
} from '@/server/regionalRegistry';
import type { CulturalRhythmId, UserLifestyleProfile } from '@/types/auth';
import { CULTURAL_RHYTHM_KEYS, deriveClinicalFocus } from '@/utils/profile';

const VALID_RHYTHMS = new Set<string>(CULTURAL_RHYTHM_KEYS);

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
      currentProfile
    }: {
      message: string;
      country?: string;
      currentProfile?: Partial<UserLifestyleProfile>;
    } = body;

    const deterministicResult = parseLifestyleDeterministically(message, currentProfile);

    // If Gemini keys are available, enhance reply with Gemini
    const keys = getGeminiApiKeys();
    if (keys.length > 0) {
      try {
        const prompt = `You are TrialN1, a clinical habit-formation and research adherence companion.
A user tracking an interventional clinical routine in ${country} just provided their daily schedule, habits, or constraints:
"${message}"

Extracted structured factors:
${JSON.stringify(deterministicResult.profileUpdates)}

Task:
Respond in 2-3 warm, professional sentences (like an expert physiotherapist or clinical trial coordinator):
1. Acknowledge their specific constraints (e.g., shift work, Dokha/shisha, fasting, sedentary office work).
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
        }
      } catch (err) {
        console.warn('[LifestyleTuneAPI] Gemini call failed, using deterministic response:', err);
      }
    }

    // Record validated crowdsourced tags to the regional registry
    const safeTags = validateRegionalTagsWithGuardrails(
      deterministicResult.extractedTags.map((label) => ({ label })),
      country
    );
    for (const tag of safeTags) {
      recordCrowdsourcedTag(country, tag.label, tag.category);
    }

    const { suggestions: updatedSuggestions } = await deriveGlobalRegionalSuggestions({
      countryCode: country,
      countryName: currentProfile?.region?.countryName,
      city: currentProfile?.region?.city,
      culturalRhythms: deterministicResult.profileUpdates.culturalRhythms ?? currentProfile?.culturalRhythms
    });
    const mergedProfile: Partial<UserLifestyleProfile> = {
      ...currentProfile,
      ...deterministicResult.profileUpdates
    };
    const suggestedFocus = deriveClinicalFocus(mergedProfile);

    return NextResponse.json({
      reply: deterministicResult.reply,
      profileUpdates: deterministicResult.profileUpdates,
      extractedTags: safeTags.map((t) => t.label),
      suggestedFocus,
      suggestions: updatedSuggestions
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
