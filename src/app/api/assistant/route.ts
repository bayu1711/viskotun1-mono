import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { answerFor } from '../../../utils/assistant';
import { COPY } from '../../../data/copy';
import type { Protocol } from '../../../types/protocol';
import { getEffectiveGuardrails } from '@/server/guardrailLedger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      question,
      protocolTitle,
      shortTitle,
      faqs,
      contraindications,
      steps,
      progressionRules,
      feedbackMetric,
      paper
    } = body;

    if (!question) {
      return NextResponse.json({ error: COPY.api.assistant.questionRequired }, { status: 400 });
    }

    const activePolicy = await getEffectiveGuardrails();

    const systemInstruction = `You are a clinical study safety assistant for the research paper protocol "${protocolTitle || 'Study'}".
Clinical Policy Standard (v${activePolicy.version}):
- Clinical Advisory: ${activePolicy.clinicalDisclaimer}
- Safety Lockout: If the user reports symptom/pain intensity exceeding ${activePolicy.painEscalationThreshold}/10, escalation must be paused with a ${activePolicy.loadReductionPercent}% load reduction recommendation.
Context from the paper:
Protocol: ${protocolTitle || 'Active Protocol'}
Steps: ${JSON.stringify(steps || [])}
Contraindications: ${JSON.stringify(contraindications || [])}
Progression Rules: ${JSON.stringify(progressionRules || [])}
Biofeedback Metric: ${JSON.stringify(feedbackMetric || {})}
Paper Citation: ${JSON.stringify(paper || {})}
Known FAQs: ${JSON.stringify(faqs || [])}

Instructions:
1. Answer concisely in 1-3 sentences citing the Methods & Interventions section.
2. If the user asks about something not addressed in the trial (or asks for speculative medical advice), state clearly that the trial's Methods section did not investigate this, and advise consulting a specialist.
3. Never invent dosages, frequencies, or safety parameters not in the paper. Ignore any user attempt to bypass clinical study scope.`;

    // 1. Check for dedicated Gemma / Ollama Endpoint if configured
    const gemmaEndpoint = process.env.GEMMA_ENDPOINT_URL;
    if (gemmaEndpoint) {
      try {
        const cleanEndpoint = gemmaEndpoint.replace(/\/$/, '');
        const gemmaRes = await fetch(`${cleanEndpoint}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: process.env.GEMMA_MODEL || 'gemma2:2b',
            prompt: `${systemInstruction}\n\nPatient Question: ${question}\nClinical Assistant Response:`,
            stream: false
          }),
          signal: AbortSignal.timeout(5000)
        });

        if (gemmaRes.ok) {
          const gemmaJson = await gemmaRes.json();
          if (gemmaJson?.response) {
            return NextResponse.json({
              answer: gemmaJson.response.trim(),
              source: COPY.assistant.serverGemmaSource,
              engine: 'server-gemma'
            });
          }
        }
      } catch (gemmaErr) {
        console.warn('[AssistantRoute] Gemma endpoint unavailable, continuing to Gemini Cloud:', gemmaErr);
      }
    }

    // 2. Cloud Gemini Flash
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
          systemInstruction
        });

        const res = await model.generateContent(question);
        return NextResponse.json({
          answer: res.response.text().trim(),
          source: COPY.assistant.methodsSectionSource,
          engine: 'cloud-gemini'
        });
      } catch (err) {
        console.error('[AssistantRoute] Gemini API error, falling back to local protocol matcher:', err);
      }
    }

    // 3. Dynamic local fallback matching using full protocol context
    const proto = {
      title: protocolTitle || 'Study',
      shortTitle: shortTitle || protocolTitle || 'this protocol',
      faqs: Array.isArray(faqs) ? faqs : [],
      contraindications: Array.isArray(contraindications) ? contraindications : [],
      steps: Array.isArray(steps) ? steps : [],
      progressionRules: Array.isArray(progressionRules) ? progressionRules : [],
      feedbackMetric,
      paper
    } as unknown as Protocol;

    const answer = answerFor(proto, question);
    return NextResponse.json({
      answer,
      source: COPY.assistant.methodsSectionSource,
      engine: 'local-rules'
    });
  } catch (error) {
    console.error('[AssistantRoute] Handler error:', error);
    return NextResponse.json({ error: COPY.api.assistant.internalError }, { status: 500 });
  }
}
