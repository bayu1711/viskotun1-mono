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
    // Rough speaking duration estimate: ~140 words per minute at 1.0x speed
    const wordCount = sanitized.split(/\s+/).length;
    const durationSeconds = Math.max(1, Math.round((wordCount / (140 * Math.max(0.5, speed))) * 60));

    // Structured breakdown for clients & audio synthesis
    return NextResponse.json(
      {
        success: true,
        text: sanitized,
        speed: Math.min(2.0, Math.max(0.5, speed)),
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
