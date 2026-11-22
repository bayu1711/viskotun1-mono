import { NextResponse } from 'next/server';
import { extractPaperRoutine } from '../../../server/geminiExtraction';
import { findCanonicalRoutine, toCanonicalRoutine } from '../../../server/routineRegistry';
import { saveExtractionCandidate } from '../../../server/candidateStore';
import { enforceRateLimit } from '../../../server/rateLimit';
import { COPY } from '../../../data/copy';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
const MAX_TEXT_LENGTH = 60_000;
const MAX_URL_LENGTH = 2_000;

export async function POST(request: Request) {
  const limited = enforceRateLimit('extract', request);
  if (limited) return limited;

  try {
    const formData = await request.formData();
    const rawFile = formData.get('file');
    const rawUrl = formData.get('url');
    const rawText = formData.get('text');

    const file = rawFile && typeof rawFile !== 'string' ? (rawFile as File) : null;
    const url = typeof rawUrl === 'string' && rawUrl.trim() ? rawUrl.trim() : null;
    const text = typeof rawText === 'string' && rawText.trim() ? rawText.trim() : null;

    if (!file && !url && !text) {
      return NextResponse.json({ error: COPY.api.extract.inputRequired }, { status: 400 });
    }

    if (url && url.length > MAX_URL_LENGTH) {
      return NextResponse.json({ error: COPY.api.extract.inputRequired }, { status: 400 });
    }

    if (text && text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: COPY.api.extract.textTooLong(MAX_TEXT_LENGTH) }, { status: 413 });
    }

    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: COPY.api.extract.fileSizeExceeded }, { status: 413 });
      }

      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        return NextResponse.json({ error: COPY.api.extract.invalidFormat }, { status: 415 });
      }
    }

    const result = await extractPaperRoutine({ file, url, text });

    if (result.success && result.routine) {
      const targetRoutine = result.routine;
      // Reuse a routine users already confirmed for this paper. A new extraction is only a candidate:
      // it is registered when the user confirms it (POST /api/papers with this candidateId), never here.
      const existing = await findCanonicalRoutine(targetRoutine.paper, targetRoutine.id);
      const canonicalRoutine = existing ?? toCanonicalRoutine(targetRoutine);
      const sourceKind = existing ? 'catalog' : result.sourceKind ?? 'pasted-text';
      const candidateId = await saveExtractionCandidate(canonicalRoutine, sourceKind);

      return NextResponse.json({
        ...result,
        routine: canonicalRoutine,
        sourceKind,
        candidateId,
        isExistingCanonical: Boolean(existing)
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: COPY.api.extract.internalError }, { status: 500 });
  }
}
