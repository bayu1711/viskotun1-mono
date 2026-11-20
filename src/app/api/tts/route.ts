import { NextRequest, NextResponse } from 'next/server';
import { COPY } from '../../../data/copy';
import { getRequestUser } from '../../../server/auth';
import { enforceRateLimit } from '../../../server/rateLimit';
import { logError } from '../../../server/log';

export const dynamic = 'force-dynamic';

/** Google Cloud TTS language per app language, with a default voice for each. */
const TTS_LANGUAGES = {
  en: { languageCode: 'en-US', defaultVoice: 'en-US-Journey-F' },
  ar: { languageCode: 'ar-XA', defaultVoice: 'ar-XA-Wavenet-A' }
} as const;

type TtsLanguage = keyof typeof TTS_LANGUAGES;

/**
 * Accepts only a Google voice name for the requested language (for example en-US-Journey-F).
 * Browser voice names such as "Google UK English Female" are not Cloud TTS voices and are ignored.
 */
function resolveVoice(language: TtsLanguage, requested: unknown): string {
  const { languageCode, defaultVoice } = TTS_LANGUAGES[language];
  if (typeof requested === 'string' && requested.startsWith(`${languageCode}-`) && /^[A-Za-z0-9-]{5,60}$/.test(requested)) {
    return requested;
  }
  return defaultVoice;
}

interface TTSRequestBody {
  text?: string;
  speed?: number;
  voice?: string;
  /** App language of `text`. Defaults to English. */
  language?: string;
}

const MAX_TEXT_LENGTH = 1200;

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  const limited = enforceRateLimit('tts', req, user);
  if (limited) return limited;

  try {
    let body: TTSRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: COPY.api.tts.invalidJson },
        { status: 400 }
      );
    }

    const { text, speed: rawSpeed = 1.0 } = body;
    const language: TtsLanguage = body.language === 'ar' ? 'ar' : 'en';
    const voice = resolveVoice(language, body.voice);
    const speed = typeof rawSpeed === 'number' && Number.isFinite(rawSpeed) ? rawSpeed : 1.0;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: COPY.api.tts.textRequired },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: COPY.api.tts.textExceeded(MAX_TEXT_LENGTH) },
        { status: 400 }
      );
    }

    const sanitized = text.trim();
    const clampedSpeed = Math.min(2.0, Math.max(0.5, speed));
    // Rough speaking duration estimate: ~140 words per minute at 1.0x speed
    const wordCount = sanitized.split(/\s+/).length;
    const durationSeconds = Math.max(1, Math.round((wordCount / (140 * clampedSpeed)) * 60));

    const googleTtsKey = process.env.GOOGLE_TTS_API_KEY;
    if (googleTtsKey) {
      try {
        const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
          method: 'POST',
          // Key in a header, not the URL, so it never lands in proxy or access logs
          headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': googleTtsKey },
          body: JSON.stringify({
            input: { text: sanitized },
            voice: {
              languageCode: TTS_LANGUAGES[language].languageCode,
              name: voice
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: clampedSpeed
            }
          }),
          signal: AbortSignal.timeout(6000)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.audioContent) {
            return NextResponse.json(
              {
                success: true,
                audioContent: data.audioContent,
                text: sanitized,
                speed: clampedSpeed,
                voice,
                language,
                estimatedDurationSec: durationSeconds,
                wordCount,
                mode: 'cloud-tts',
                generatedAt: new Date().toISOString()
              },
              {
                headers: {
                  'Cache-Control': 'private, max-age=3600'
                }
              }
            );
          }
        }
      } catch (cloudErr) {
        console.warn('[/api/tts] Google Cloud TTS error, falling back to client synthesis:', cloudErr);
      }
    }

    // Structured breakdown for clients & audio synthesis
    return NextResponse.json(
      {
        success: true,
        text: sanitized,
        speed: clampedSpeed,
        voice,
        language,
        estimatedDurationSec: durationSeconds,
        wordCount,
        mode: 'synthesized-coach-cue',
        generatedAt: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=3600'
        }
      }
    );
  } catch (error) {
    logError('TtsRoute.POST', error);
    return NextResponse.json(
      { error: COPY.api.tts.synthesisFailed },
      { status: 500 }
    );
  }
}
