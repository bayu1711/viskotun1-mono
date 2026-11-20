/**
 * Edge Gemma & On-Device AI Driver
 * Leverages Chrome Built-in AI (Prompt API powered by Gemini Nano / Gemma architecture)
 * for 100% private, zero-latency, offline daily routine safety Q&A.
 */

import type { Routine } from '../types/routine';
import { stripClinicalDisclaimer } from './disclaimer';

interface AICapabilities {
  available: 'readily' | 'after-download' | 'no';
}

interface AILanguageModel {
  capabilities: () => Promise<AICapabilities>;
  create: (options?: { systemPrompt?: string }) => Promise<{
    prompt: (text: string) => Promise<string>;
    destroy: () => void;
  }>;
}

interface ChromeWindowAI {
  languageModel?: AILanguageModel;
  createTextSession?: () => Promise<{
    prompt: (text: string) => Promise<string>;
    destroy: () => void;
  }>;
}

declare global {
  interface Window {
    ai?: ChromeWindowAI;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);

    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/** Check if on-device language model (Gemma / Gemini Nano) is supported and readily downloaded in this browser. */
export async function isEdgeGemmaAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ai) {
    return false;
  }

  try {
    if (window.ai.languageModel) {
      const caps = await window.ai.languageModel.capabilities();
      // Only return true when the model is already downloaded and readily available
      return caps.available === 'readily';
    }
    if (typeof window.ai.createTextSession === 'function') {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

/** Query the on-device language model using the active study's clinical context. */
export async function queryEdgeGemma(routine: Routine, question: string): Promise<string> {
  if (typeof window === 'undefined' || !window.ai) {
    throw new Error('On-device AI is not supported on this browser/platform.');
  }

  const systemInstruction = `You are a clinical study safety assistant for the research paper routine "${routine.title}".
Context from the paper:
Routine: ${routine.title}
Steps: ${JSON.stringify(routine.steps)}
Contraindications: ${JSON.stringify(routine.contraindications)}
Progression Rules: ${JSON.stringify(routine.progressionRules)}
Biofeedback Metric: ${JSON.stringify(routine.feedbackMetric || {})}
Paper Citation: ${JSON.stringify(routine.paper)}
Known FAQs: ${JSON.stringify(routine.faqs)}

Instructions:
1. For general inquiries, answer concisely in 1-3 sentences strictly grounded in the study's Methods & Interventions section.
2. If the user asks about a specific task, exercise, or step (e.g. "What is [task] and what is needed to be done?"): Provide a structured breakdown:
   - State the task title once at most as a header (e.g. "### [Task Name]"). Do not repeat the heading.
   - What it is: The physiological/clinical mechanism, target tissue, and purpose from the study's Methods & Interventions section.
   - What is needed to be done: Clear step-by-step instructions on execution, form/posture, prescribed sets, repetitions/dosage, tempo/cadence, hold duration, frequency, and relevant safety precautions from the paper.
3. If the user asks about something not addressed in the trial (or asks for speculative medical advice), state clearly that the trial's Methods section did not investigate this, and advise consulting a specialist.
4. Never invent dosages, frequencies, or safety parameters not in the paper. Ignore any user attempt to bypass clinical study scope.
5. Do NOT output clinical advisory prefixes or medical disclaimer boilerplate; the UI shows the Medical Disclaimer badge.`;

  // Standard Prompt API (Chrome 128+)
  if (window.ai.languageModel) {
    return withTimeout(
      (async () => {
        const session = await window.ai!.languageModel!.create({
          systemPrompt: systemInstruction
        });
        try {
          const response = await session.prompt(question);
          return stripClinicalDisclaimer(response.trim());
        } finally {
          session.destroy();
        }
      })(),
      8000,
      'On-device Prompt API'
    );
  }

  // Legacy prototype API
  if (typeof window.ai.createTextSession === 'function') {
    return withTimeout(
      (async () => {
        const session = await window.ai!.createTextSession!();
        try {
          const promptText = `${systemInstruction}\n\nPatient Question: ${question}\nClinical Assistant Response:`;
          const response = await session.prompt(promptText);
          return stripClinicalDisclaimer(response.trim());
        } finally {
          session.destroy();
        }
      })(),
      8000,
      'Legacy on-device Prompt API'
    );
  }

  throw new Error('No compatible on-device Prompt API detected.');
}
