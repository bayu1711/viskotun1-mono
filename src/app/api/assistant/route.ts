import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, protocolTitle, faqs, contraindications, steps } = body;

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const context = `
Protocol: ${protocolTitle || 'Active Protocol'}
Steps: ${JSON.stringify(steps || [])}
Contraindications: ${JSON.stringify(contraindications || [])}
Known FAQs: ${JSON.stringify(faqs || [])}
`;
        const prompt = `You are a clinical study safety assistant for the research paper protocol "${protocolTitle || 'Study'}".
Context from the paper:
${context}

User question: "${question}"

Instructions:
1. Answer concisely in 1-3 sentences citing the Methods & Interventions section.
2. If the user asks about something not addressed in the trial (or asks for speculative medical advice), state clearly that the trial's Methods section did not investigate this, and advise consulting a healthcare professional.
3. Never invent dosages, frequencies, or safety parameters not in the paper.`;

        const res = await model.generateContent(prompt);
        return NextResponse.json({
          answer: res.response.text().trim(),
          source: 'Methods & Interventions Section'
        });
      } catch (err) {
        console.error('[AssistantRoute] Gemini API error, falling back to local FAQ matcher:', err);
      }
    }

    // Local fallback matching
    if (Array.isArray(faqs)) {
      const qLower = String(question).toLowerCase();
      const match = faqs.find((f: { keywords: string[] }) =>
        Array.isArray(f.keywords) && f.keywords.some((k: string) => qLower.includes(k.toLowerCase()))
      );
      if (match?.answer) {
        return NextResponse.json({
          answer: match.answer,
          source: 'Methods & Interventions Section'
        });
      }
    }

    return NextResponse.json({
      answer: `The trial authors did not report data on this in the Methods section. Try asking about dosing, frequency, safety rules or progression for ${protocolTitle || 'this protocol'}.`,
      source: 'Methods & Interventions Section'
    });
  } catch (error) {
    console.error('[AssistantRoute] Handler error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
