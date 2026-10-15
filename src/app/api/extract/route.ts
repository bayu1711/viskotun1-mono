import { NextResponse } from 'next/server';
import { extractPaperProtocol } from '@/server/geminiExtraction';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;
    const text = formData.get('text') as string | null;

    if (!file && !url && !text) {
      return NextResponse.json({ error: 'PDF file or paper URL/DOI is required' }, { status: 400 });
    }

    if (file) {
      const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: 'File size exceeds maximum limit of 20MB' }, { status: 413 });
      }

      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        return NextResponse.json({ error: 'Invalid file format. Only PDF files are supported.' }, { status: 415 });
      }
    }

    const result = await extractPaperProtocol({ file, url, text });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: 'Internal Server Error during extraction' }, { status: 500 });
  }
}
