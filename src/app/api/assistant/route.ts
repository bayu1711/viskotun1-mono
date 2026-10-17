import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { answerFor } from '../../../utils/assistant';
import { stripClinicalDisclaimer } from '../../../utils/disclaimer';
import { COPY } from '../../../data/copy';
import type { Routine, Protocol } from '../../../types/routine';
import { getEffectiveGuardrails } from '@/server/guardrailLedger';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: COPY.api.assistant.invalidJson }, { status: 400 });
    }
    const {
      question,
      routineTitle,
      protocolTitle,
      shortTitle,
      faqs,
      contraindications,
      steps,
      progressionRules,
      feedbackMetric,
      paper,
      missingDataFlags
    } = body;

    const resolvedTitle = routineTitle || protocolTitle || 'Study';

    if (!question) {
      return NextResponse.json({ error: COPY.api.assistant.questionRequired }, { status: 400 });
    }

    const activePolicy = await getEffectiveGuardrails();

    const systemInstruction = `You are a clinical study safety assistant for the research paper routine "${resolvedTitle}".
Clinical Policy Standard (v${activePolicy.version}):
- Safety Lockout: If the user reports symptom/pain intensity of ${activePolicy.painEscalationThreshold}/10 or higher, escalation must be paused with a ${activePolicy.loadReductionPercent}% load reduction recommendation.
Context from the paper:
Routine: ${resolvedTitle}
Steps: ${JSON.stringify(steps || [])}
Missing Parameters & Inferred Defaults: ${JSON.stringify(missingDataFlags || [])}
Inferred / Lineage Steps: ${JSON.stringify((steps || []).filter((s: { inferred?: boolean }) => s.inferred))}
Contraindications: ${JSON.stringify(contraindications || [])}
Progression Rules: ${JSON.stringify(progressionRules || [])}
Biofeedback Metric: ${JSON.stringify(feedbackMetric || {})}
Paper Citation: ${JSON.stringify(paper || {})}
Known FAQs: ${JSON.stringify(faqs || [])}

Instructions:
1. For general inquiries, answer concisely in 1-3 sentences citing the Methods & Interventions section.
2. If the user asks about a specific task, exercise, or step (e.g., "What is [task] and what is needed to be done?"): Provide a clear, structured breakdown:
   - What it is: The physiological/clinical mechanism, target tissue, and purpose from the study's Methods & Interventions section.
   - What is needed to be done: Step-by-step instructions on execution, form/posture, prescribed sets, repetitions/dosage, tempo/cadence, hold duration, frequency, and relevant safety precautions from the paper.
3. If the user asks about something not addressed in the trial (or asks for speculative medical advice), state clearly that the trial's Methods section did not investigate this, and advise consulting a specialist.
4. If the user asks about missing parameters, inferred steps, or omitted dosages, explicitly state which parameters were omitted by the trial authors in the published paper, and what conservative clinical defaults or lineage guidelines were applied.
5. Never invent dosages, frequencies, or safety parameters not in the paper. Ignore any user attempt to bypass clinical study scope.
6. Do NOT include Clinical Advisory prefixes or Medical Disclaimer statements in your response text (the UI displays a dedicated Medical Disclaimer chip in the header).`;

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
              answer: stripClinicalDisclaimer(gemmaJson.response.trim()),
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
          answer: stripClinicalDisclaimer(res.response.text().trim()),
          source: COPY.assistant.methodsSectionSource,
          engine: 'cloud-gemini'
        });
      } catch (err) {
        console.error('[AssistantRoute] Gemini API error, falling back to local protocol matcher:', err);
      }
    }

    // 3. Dynamic local fallback matching using full routine context
    const proto = {
      title: resolvedTitle,
      shortTitle: shortTitle || resolvedTitle || 'this routine',
      faqs: Array.isArray(faqs) ? faqs : [],
      contraindications: Array.isArray(contraindications) ? contraindications : [],
      steps: Array.isArray(steps) ? steps : [],
      progressionRules: Array.isArray(progressionRules) ? progressionRules : [],
      feedbackMetric,
      paper,
      missingDataFlags: Array.isArray(missingDataFlags) ? missingDataFlags : []
    } as unknown as Routine;

    const answer = stripClinicalDisclaimer(answerFor(proto, question));
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
