import { NextResponse } from 'next/server';
import { extractPaperProtocol } from '@/server/geminiExtraction';
import { COPY } from '@/data/copy';

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

    const result = await extractPaperProtocol({ file, url, text });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: COPY.api.extract.internalError }, { status: 500 });
  }
}
