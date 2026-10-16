import { NextResponse } from 'next/server';
import { extractPaperRoutine } from '../../../server/geminiExtraction';
import { saveCanonicalRoutine } from '../../../server/routineRegistry';
import { COPY } from '../../../data/copy';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;
    const text = formData.get('text') as string | null;

    if (!file && !url && !text) {
      return NextResponse.json({ error: COPY.api.extract.inputRequired }, { status: 400 });
    }

    if (file) {
      const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: COPY.api.extract.fileSizeExceeded }, { status: 413 });
      }

      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        return NextResponse.json({ error: COPY.api.extract.invalidFormat }, { status: 415 });
      }
    }

    const result = await extractPaperRoutine({ file, url, text });

    if (result.success && (result.routine || result.protocol)) {
      const targetRoutine = (result.routine || result.protocol)!;
      const { protocol: canonicalRoutine, isNew } = await saveCanonicalRoutine(targetRoutine);
      return NextResponse.json({
        ...result,
        routine: canonicalRoutine,
        protocol: canonicalRoutine,
        isExistingCanonical: !isNew
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: COPY.api.extract.internalError }, { status: 500 });
  }
}
