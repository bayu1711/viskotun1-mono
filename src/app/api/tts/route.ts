import { NextRequest, NextResponse } from 'next/server';
import { COPY } from '../../../data/copy';

interface TTSRequestBody {
  text?: string;
  speed?: number;
  voice?: string;
}

const MAX_TEXT_LENGTH = 1200;

export async function POST(req: NextRequest) {
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

    const { text, speed = 1.0, voice } = body;

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
        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleTtsKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: sanitized },
            voice: {
              languageCode: 'en-US',
              name: voice || 'en-US-Journey-F'
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
                voice: voice || 'en-US-Journey-F',
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
        voice: voice || 'en-US-Standard-C',
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
    console.error('[/api/tts] Speech synthesis error:', error);
    return NextResponse.json(
      { error: COPY.api.tts.synthesisFailed },
      { status: 500 }
    );
  }
}
