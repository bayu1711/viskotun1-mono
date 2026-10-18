import { GoogleGenerativeAI } from '@google/generative-ai';
import { COPY } from '../data/copy';
import type { Routine, Protocol } from '../types/routine';
import { applyGuardrailThreshold } from '../utils/routineMetrics';
import { generateFallbackRoutine } from './fallbackRoutines';
import { classifyPaperSource, containsTerm } from './gatekeeper';
import { getEffectiveGuardrails } from './guardrailLedger';
import { findCanonicalProtocol } from './routineRegistry';
import { validateAndRegisterProtocolWidgets } from './widgetRegistry';
import { executeWithGeminiFailover, getGeminiApiKeys } from './geminiKeys';

export interface ExtractInput {
  file?: File | null;
  url?: string | null;
  text?: string | null;
}

export interface ExtractResult {
  success: boolean;
  eligible: boolean;
  rejectionReason?: string;
  routine?: Routine;
  protocol?: Routine;
  isExistingCanonical?: boolean;
  source: string;
}

const SYSTEM_PROMPT = `You are ViskotuN1, an expert clinical & scientific routine extraction AI.
Your role is to transform dense peer-reviewed research papers into executable, adaptive daily routines with zero hallucinated gaps.

### STRICT GATEKEEPER CRITERIA:
1. ELIGIBILITY:
   The study MUST describe an INTERVENTIONAL study with HUMAN participants (clinical rehabilitation, physical therapy, pharmacology, supplementation, sleep scheduling, nutrition, or cognitive/behavioral interventions).
2. IMMEDIATE REJECTION:
   You MUST REJECT and set eligible=false if the study is:
   - Non-human (in vitro, cell cultures, animal models such as mice, rats, rabbits).
   - Purely observational or demographic without a prescribed executable intervention.
   - Theoretical physics, mathematics, cosmology, quantum theory, computer science, economics, or general non-human science.
   Provide a clear educational rejectionReason explaining why. Start it with the matching label:
   "Declined: Non-human / rodent model.", "Declined: In vitro / cell culture study.",
   "Declined: Theoretical / non-human science." or "Declined: Observational study lacking an executable routine."
3. ADAPTIVE BIOFEEDBACK & SAFETY METRIC (feedbackMetric):
   Dynamically extract the study's primary subjective adverse effect, symptom, or tolerability measure:
   - Musculoskeletal / rehab -> name: "tendon discomfort" or "joint soreness", label: "tendon discomfort / load tolerance", eyebrow: "discomfort"
   - Dermatology / hair / topical -> name: "scalp irritation", label: "scalp irritation / erythema", eyebrow: "irritation"
   - Pharmacology / supplementation -> name: "GI distress", label: "gastrointestinal distress / nausea", eyebrow: "tolerance"
   - Sleep / cognitive interventions -> name: "mental fatigue", label: "daytime grogginess / mental fatigue", eyebrow: "fatigue"
   - Physical exertion / cardio -> name: "exertion", label: "rating of perceived exertion (RPE)", eyebrow: "exertion"
   Never force physical therapy metrics if the study is in nutrition, pharmacology, sleep, or dermatology.
4. DATA COLLECTION SPEC (MORPHING UI PIPELINE):
   Extract the exact outcome measures and endpoints into dataCollectionSpec:
   - Clinical photos (dermatology, posture, wound healing) -> type: "photo", frequency: "milestone", milestoneDays: [1, 14, 30]
   - Physiological biomarkers (glucose, blood pressure, ROM degrees) -> type: "numeric", unit: string, min & max
   - Functional timed performance (reaction time, balance hold) -> type: "timer", unit: "seconds"
   - Validated categorical criteria (sleepiness scale, stool scale) -> type: "multichoice", with options
   - Symptoms / perceived discomfort -> type: "scale", min: 0, max: 10, with escalationThreshold
   - If the paper requires a specialized measurement widget not covered by ["scale", "numeric", "photo", "timer", "multichoice", "boolean"] (e.g. breath-pacer, body-pain-map, goniometer, composite-index), include a "proposedWidget" object on the field with { "requestedType": string, "title": string, "description": string, "unit": string, "min": number, "max": number, "step": number } so it can be validated with human oversight.

### OUTPUT JSON FORMAT:
Return a JSON object conforming strictly to:
{
  "eligible": boolean,
  "rejectionReason": string, // only if eligible is false
  "protocol": {
    "id": string, // lowercase kebab-case slug
    "title": string,
    "shortTitle": string, // 2-3 words
    "icon": "straight-knee" | "bent-knee" | "stretch" | "serum" | "microneedle" | "shampoo" | "fitness" | "pill" | "timer" | "heart" | "science" | "water" | "brain" | "sleep" | "sun" | "diet" | "walk" | "check",
    "phase": string,
    "phaseLabel": string,
    "totalDays": number,
    "currentDay": 1,
    "streak": 1,
    "paper": {
      "title": string,
      "fileName": string,
      "authors": string,
      "year": number,
      "journal": string,
      "doi": string,
      "sampleSize": number,
      "trialType": string,
      "evidenceBadges": ("rct" | "pilot" | "missing-parameters")[],
      "pages": number
    },
    "steps": [
      {
        "id": string,
        "tone": "orange" | "yellow" | "sky" | "lavender" | "peach" | "mint" | "cream" | "ink",
        "icon": string,
        "action": string,
        "detail": string,
        "sets": number, // count of daily rounds, doses, applications, or sets
        "reps": number, // repetitions if physical exercise, or 1 for discrete doses/sessions
        "frequency": string, // e.g. "1x Daily", "Morning & Night", "3x Weekly"
        "tempo": string, // optional: cadence if physical exercise (e.g. "3s eccentric")
        "durationSeconds": number, // optional: duration if timed exposure/hold (e.g. 1200 for 20m light therapy)
        "inferred": boolean, // MUST BE true if key parameters (dosage, rest window, hold time) were omitted by authors
        "setLabel": string, // unit label: "dose", "serving", "application", "session", or "sets"
        "perSetLabel": string, // per-round description: e.g. "× 5g with meal", "× 1 mL topical", "× 15 reps"
        "statLabel": string, // primary measure label: e.g. "dose:", "volume:", "duration:", "reps:"
        "statValue": string // primary measure value: e.g. "5g", "1 mL", "20 min", "15"
      }
    ],
    "progressionRules": [
      { "id": string, "condition": string, "action": string }
    ],
    "contraindications": [
      { "id": string, "text": string, "severity": "stop" | "caution" }
    ],
    "missingDataFlags": [
      { "stepId": string, "parameter": string, "fallback": string }
    ],
    "feedbackMetric": {
      "name": string,
      "label": string,
      "eyebrow": string,
      "logTitle": string,
      "minLabel": string,
      "maxLabel": string,
      "maxScore": 10,
      "escalationThreshold": number,
      "escalationMessage": string
    },
    "dataCollectionSpec": [
      {
        "id": string,
        "name": string,
        "label": string,
        "type": "scale" | "numeric" | "photo" | "timer" | "multichoice" | "boolean",
        "frequency": "daily" | "milestone" | "weekly",
        "milestoneDays": [1, 14, 30],
        "unit": string,
        "min": number,
        "max": number,
        "step": number,
        "options": ["string"],
        "instructions": string,
        "escalationThreshold": number,
        "escalationMessage": string
      }
    ],
    "dayHistory": [],
    "initialSetsDone": {},
    "initialFeedbackLogs": [],
    "initialMorphingLogs": [],
    "initialMessages": [
      { "id": string, "role": "user", "kind": "file", "content": string, "timestamp": string },
      { "id": string, "role": "ai", "kind": "text", "content": string, "timestamp": string },
      { "id": string, "role": "ai", "kind": "protocol", "content": string, "timestamp": string }
    ],
    "community": {
      "studyEfficacy": number,
      "realWorldEfficacy": number,
      "userCount": number,
      "medianAdherence": number,
      "dropOffUnit": "day" | "week",
      "peakPeriod": number,
      "dropOff": [{ "period": number, "dropOff": number }],
      "insightLead": string,
      "insightRest": string,
      "reviews": [
        { "id": string, "handle": string, "day": number, "outcome": "improved" | "adjusted" | "paused", "text": string, "adherence": number }
      ]
    },
    "faqs": [
      { "question": string, "keywords": string[], "answer": string }
    ]
  }
}
`;

export async function extractPaperProtocol(input: ExtractInput): Promise<ExtractResult> {
  const sourceName = input.file ? input.file.name : input.url || input.text || 'uploaded-document.pdf';

  // 1. Resolve live policy from Cloud Firestore Guardrail Ledger
  const activePolicy = await getEffectiveGuardrails();

  // Local gatekeeper first: it names the specific category (animal, in vitro, theoretical, observational)
  const localCheck = classifyPaperSource(sourceName);
  if (localCheck.declined) {
    return {
      success: true,
      eligible: false,
      rejectionReason: localCheck.reason,
      source: sourceName
    };
  }

  // Then any extra criteria an admin added to the live Firestore policy (whole-word match)
  const matchedBannedKeyword = activePolicy.bannedKeywords.find((kw) => containsTerm(sourceName, kw));
  if (matchedBannedKeyword) {
    return {
      success: true,
      eligible: false,
      rejectionReason: COPY.extraction.matchedBannedKeyword(matchedBannedKeyword, activePolicy.version),
      source: sourceName
    };
  }

  // Check if paper is already cataloged in the Canonical Protocol Registry
  const doiMatch = sourceName.match(/10\.\d{4,9}\/[^\s"<>]+/i);
  const detectedDoi = doiMatch ? doiMatch[0].replace(/[.,;)]+$/, '') : undefined;
  const cleanTitle = sourceName.replace(/\.pdf$/i, '').trim();

  const existing = await findCanonicalProtocol({
    doi: detectedDoi,
    title: cleanTitle,
    id: cleanTitle
  });

  if (existing) {
    const routine = applyGuardrailThreshold(
      existing,
      activePolicy.painEscalationThreshold,
      activePolicy.escalationAlertMessage
    );
    return {
      success: true,
      eligible: true,
      routine,
      protocol: routine,
      isExistingCanonical: true,
      source: sourceName
    };
  }

  // If Gemini API keys are configured, execute real multimodal extraction with failover
  const geminiKeys = getGeminiApiKeys();
  if (geminiKeys.length > 0) {
    try {
      const extracted = await executeWithGeminiFailover(async (apiKey) => {
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelName = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json'
          }
        });

        const dynamicPolicyInstruction = `\n### ACTIVE CLINICAL GUARDRAIL POLICY (Version: ${activePolicy.version}):
- Escalation Threshold: If subjective discomfort/pain reaches ${activePolicy.painEscalationThreshold}/10 or higher, escalation MUST be paused with a ${activePolicy.loadReductionPercent}% load reduction.
- Mandatory Clinical Disclaimer: "${activePolicy.clinicalDisclaimer}"
- Banned criteria: Studies matching [${activePolicy.bannedKeywords.join(', ')}] MUST be marked eligible=false.`;

        let promptParts: (string | { inlineData: { data: string; mimeType: string } })[] = [];

        if (input.file) {
          const buffer = Buffer.from(await input.file.arrayBuffer());
          const base64Data = buffer.toString('base64');
          promptParts = [
            {
              inlineData: {
                data: base64Data,
                mimeType: 'application/pdf'
              }
            },
            SYSTEM_PROMPT,
            dynamicPolicyInstruction,
            `Analyze this attached PDF (${input.file.name}). First check the strict gatekeeper criteria. If interventional human science, extract the full protocol.`
          ];
        } else {
          promptParts = [
            SYSTEM_PROMPT,
            dynamicPolicyInstruction,
            `Analyze this paper link or text: ${input.url || input.text}. First check gatekeeper criteria, then extract the protocol if eligible.`
          ];
        }

        const response = await model.generateContent(promptParts);
        const text = response.response.text();
        const cleanJson = text
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();
        const parsed = JSON.parse(cleanJson);

        if (!parsed.eligible) {
          return {
            success: true,
            eligible: false,
            rejectionReason:
              parsed.rejectionReason || COPY.processing.rejectionFallback,
            source: sourceName
          };
        }

        if (parsed.protocol) {
          const protocol: Protocol = {
            ...parsed.protocol,
            version: parsed.protocol.version || '1.0',
            changelog: parsed.protocol.changelog && parsed.protocol.changelog.length > 0
              ? parsed.protocol.changelog
              : [
                  {
                    version: '1.0',
                    date: new Date().toISOString(),
                    summary: 'Initial clinical protocol extraction',
                    author: 'Gemini Multimodal Extraction'
                  }
                ],
            dayHistory: parsed.protocol.dayHistory ?? [],
            initialSetsDone: parsed.protocol.initialSetsDone ?? {},
            initialFeedbackLogs: parsed.protocol.initialFeedbackLogs ?? [],
            feedbackMetric: parsed.protocol.feedbackMetric
              ? {
                  ...parsed.protocol.feedbackMetric,
                  escalationThreshold: activePolicy.painEscalationThreshold,
                  escalationMessage: activePolicy.escalationAlertMessage
                }
              : undefined,
            initialMessages: parsed.protocol.initialMessages ?? [
              {
                id: `${parsed.protocol.id}-msg-1`,
                role: 'user',
                kind: 'file',
                content: sourceName,
                timestamp: COPY.assistant.timestampJustNow
              },
              {
                id: `${parsed.protocol.id}-msg-2`,
                role: 'ai',
                kind: 'text',
                content: COPY.assistant.parsedSummary(parsed.protocol.paper?.pages ?? 'the'),
                timestamp: COPY.assistant.timestampJustNow
              },
              {
                id: `${parsed.protocol.id}-msg-3`,
                role: 'ai',
                kind: 'protocol',
                content: parsed.protocol.id,
                timestamp: COPY.assistant.timestampJustNow
              }
            ]
          };

          const validatedProtocol = await validateAndRegisterProtocolWidgets(protocol);

          return {
            success: true,
            eligible: true,
            routine: validatedProtocol,
            protocol: validatedProtocol,
            source: sourceName
          };
        }

        throw new Error('Gemini output missing protocol or eligible field');
      });

      if (extracted) {
        return extracted;
      }
    } catch (err) {
      console.error('[GeminiExtraction] Error calling Gemini API, falling back to simulated extraction:', err);
    }
  }

  // Development / fallback mode: provides instant, calibrated routine extraction
  const fallbackRoutine = await validateAndRegisterProtocolWidgets(
    generateFallbackRoutine(sourceName)
  );
  if (fallbackRoutine.feedbackMetric) {
    fallbackRoutine.feedbackMetric = {
      ...fallbackRoutine.feedbackMetric,
      escalationThreshold: activePolicy.painEscalationThreshold,
      escalationMessage: activePolicy.escalationAlertMessage
    };
  }

  return {
    success: true,
    eligible: true,
    routine: fallbackRoutine,
    protocol: fallbackRoutine,
    source: sourceName
  };
}

export const extractPaperRoutine = extractPaperProtocol;

