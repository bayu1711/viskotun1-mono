import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, protocolTitle } = body;

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Ready for Gemini on Vertex AI integration:
    // Uses Google Cloud credentials on Cloud Run without exposing secrets to the browser.
    return NextResponse.json({
      answer: `Based on the reported Methods section for ${protocolTitle || 'the study'}, here is the evidence regarding "${question}".`,
      source: 'Methods & Interventions Section'
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
