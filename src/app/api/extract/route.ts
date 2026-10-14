import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;

    if (!file && !url) {
      return NextResponse.json({ error: 'PDF file or paper URL/DOI is required' }, { status: 400 });
    }

    // Ready for Multimodal PDF extraction via Gemini on Vertex AI:
    return NextResponse.json({
      success: true,
      message: 'Paper received and processing initiated via Vertex AI',
      source: file ? file.name : url
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
