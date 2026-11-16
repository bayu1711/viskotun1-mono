import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { executeWithGeminiFailover, getGeminiApiKeys } from '@/server/geminiKeys';
import {
  getRegionalSuggestions,
  parseLifestyleDeterministically,
  recordCrowdsourcedTag
} from '@/server/regionalRegistry';
import type { UserLifestyleProfile } from '@/types/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country') || 'AE';
  const suggestions = getRegionalSuggestions(country);
  return NextResponse.json({ country, suggestions });
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
        const prompt = `You are Viskotu, a clinical habit-formation and research adherence companion.
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

    // Record any novel extracted tags to the regional crowdsourced registry
    for (const tag of deterministicResult.extractedTags) {
      recordCrowdsourcedTag(country, tag);
    }

    const updatedSuggestions = getRegionalSuggestions(country);

    return NextResponse.json({
      reply: deterministicResult.reply,
      profileUpdates: deterministicResult.profileUpdates,
      extractedTags: deterministicResult.extractedTags,
      suggestions: updatedSuggestions
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
