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

    const result = await extractPaperProtocol({ file, url, text });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: 'Internal Server Error during extraction' }, { status: 500 });
  }
}
