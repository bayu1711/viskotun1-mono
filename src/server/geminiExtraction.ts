import { GoogleGenerativeAI } from '@google/generative-ai';
import { COPY } from '../data/copy';
import type { Routine, RoutineStep } from '../types/routine';
import { applyGuardrailThreshold } from '../utils/routineMetrics';
import { resolveStepTiming } from '../utils/schedule';
import { generateFallbackRoutine } from './fallbackRoutines';
import { classifyPaperSource, containsTerm } from './gatekeeper';
import { getEffectiveGuardrails } from './guardrailLedger';
import { findCanonicalRoutine } from './routineRegistry';
import { validateRoutineWidgets } from './widgetRegistry';
import { validateExtractedRoutine } from './routineSchema';
import { logEvent } from './log';
import { executeWithGeminiFailover, getGeminiApiKeys } from './geminiKeys';
import { resolvePaperSource, type PaperResolution } from './paperSource';
import { extractQueryFromInput } from '../utils/paperQuery';

export interface ExtractInput {
  file?: File | null;
  url?: string | null;
  text?: string | null;
}

/**
 * Where an extracted routine's content came from. Only `europe-pmc` (full text fetched by the
 * server from Europe PMC) is trusted enough to become the shared routine for a paper.
 */
export type ExtractionSourceKind = 'europe-pmc' | 'pdf-upload' | 'pasted-text' | 'demo-fallback' | 'catalog';

export interface ExtractResult {
  success: boolean;
  eligible: boolean;
  sourceKind?: ExtractionSourceKind;
  rejectionReason?: string;
  errorType?: 'unrecognized' | 'not-found' | 'no-full-text' | 'policy-rejection';
  suggestedQuery?: string;
  routine?: Routine;
  isExistingCanonical?: boolean;
  source: string;
}

const SYSTEM_PROMPT = `You are TrialN1, an expert clinical & scientific routine extraction AI.
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
5. CLINICAL TIMING ARCHETYPE (step.timing):
   Classify EVERY extracted step with a "timing" object so TrialN1 can reconcile the paper's timing requirements against each participant's real-world available time windows:
   - "flexible": Session can be done in any open window (e.g. daily cardio, resistance training, cognitive drills, stretches).
   - "spaced": Must be split across 2+ separated sessions (e.g. 2x/day eccentric rehab, morning & night topical serum/supplement). Include "minSpacingHours" (e.g. 8).
   - "anchored": Biologically or cue-anchored to a specific part of the day (e.g. morning sunlight, pre-bed warm bath, post-dinner extinction cue, upon-waking patch). Include "anchorSlot": "wake" | "morning" | "midday" | "meal" | "evening" | "bedtime".
   - "on_demand": Trigger-based / PRN behavioral or rescue step (e.g. smoking cessation craving urge-surfing, rescue breathwork/walk when an urge hits). NEVER force these into a fixed time slot.
   - "continuous": All-day boundary or adherence rule confirmed once per day (e.g. daily cigarette/bowl cap, abstinence rule, throughout-day hydration target).
   Always include "anchorHint" (short clinical cue) and "estimatedMinutes" (realistic session duration).

### OUTPUT JSON FORMAT:
Return a JSON object conforming strictly to:
{
  "eligible": boolean,
  "rejectionReason": string, // only if eligible is false
  "routine": {
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
        "statValue": string, // primary measure value: e.g. "5g", "1 mL", "20 min", "15"
        "timing": {
          "type": "flexible" | "spaced" | "anchored" | "on_demand" | "continuous",
          "anchorHint": string, // e.g. "When a craving hits", "90 min before bed", "Morning & evening >=8h apart"
          "anchorSlot": "wake" | "morning" | "midday" | "meal" | "evening" | "bedtime", // required when type is "anchored"
          "minSpacingHours": number, // required when type is "spaced" (e.g. 8)
          "estimatedMinutes": number // estimated duration in minutes
        }
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
        "targetMin": number,
        "targetMax": number,
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
      { "id": string, "role": "ai", "kind": "routine", "content": string, "timestamp": string }
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

type GuardrailPolicy = Awaited<ReturnType<typeof getEffectiveGuardrails>>;

/**
 * Checks that settle a paper without an LLM call. `screenText` is matched against the gatekeeper and
 * banned keywords; `lookup` (DOI and title) against the canonical routine registry.
 */
async function screenPaper(
  screenText: string,
  lookup: { doi?: string; title: string },
  sourceName: string,
  activePolicy: GuardrailPolicy
): Promise<ExtractResult | null> {
  // Local gatekeeper first: it names the specific category (animal, in vitro, theoretical, observational)
  const localCheck = classifyPaperSource(screenText);
  if (localCheck.declined) {
    return {
      success: true,
      eligible: false,
      errorType: 'policy-rejection',
      rejectionReason: localCheck.reason,
      source: sourceName
    };
  }

  // Then any extra criteria an admin added to the live Firestore policy (whole-word match)
  const matchedBannedKeyword = activePolicy.bannedKeywords.find((kw) => containsTerm(screenText, kw));
  if (matchedBannedKeyword) {
    return {
      success: true,
      eligible: false,
      errorType: 'policy-rejection',
      rejectionReason: COPY.extraction.matchedBannedKeyword(matchedBannedKeyword, activePolicy.version),
      source: sourceName
    };
  }

  // Check if paper is already cataloged in the Canonical Routine Registry
  const existing = await findCanonicalRoutine({
    doi: lookup.doi,
    title: lookup.title,
    id: lookup.title
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
      isExistingCanonical: true,
      sourceKind: 'catalog',
      source: sourceName
    };
  }

  return null;
}

/**
 * Reading a whole paper and writing a routine takes far longer than a chat reply, so extraction
 * gets its own per-key limit instead of the 15 s default. Two keys fit inside the client's
 * EXTRACTION_CLIENT_TIMEOUT_MS (src/data/config.ts).
 */
export const EXTRACTION_PER_KEY_TIMEOUT_MS = 40_000;
/** Whole extraction budget across keys; stays under EXTRACTION_CLIENT_TIMEOUT_MS (95 s). */
export const EXTRACTION_TOTAL_DEADLINE_MS = 85_000;

const UNRESOLVED_LINK_REASONS: Record<Exclude<PaperResolution, { ok: true }>['reason'], string> = {
  unrecognized: COPY.extraction.linkNotRecognized,
  'not-found': COPY.extraction.paperNotFound,
  'no-full-text': COPY.extraction.fullTextUnavailable
};

export async function extractPaperRoutine(input: ExtractInput): Promise<ExtractResult> {
  const sourceName = input.file ? input.file.name : input.url || input.text || 'uploaded-document.pdf';

  // 1. Resolve live policy from Cloud Firestore Guardrail Ledger
  const activePolicy = await getEffectiveGuardrails();

  const doiMatch = sourceName.match(/10\.\d{4,9}\/[^\s"<>]+/i);
  const screened = await screenPaper(
    sourceName,
    {
      doi: doiMatch ? doiMatch[0].replace(/[.,;)]+$/, '') : undefined,
      title: sourceName.replace(/\.pdf$/i, '').trim()
    },
    sourceName,
    activePolicy
  );
  if (screened) return screened;

  // A link is never sent to the model on its own: it would guess the paper from the URL string.
  // Fetch the real open-access full text first, or ask for the PDF.
  let linkedPaper: Extract<PaperResolution, { ok: true }>['paper'] | null = null;
  if (!input.file && input.url) {
    let resolution: PaperResolution;
    try {
      resolution = await resolvePaperSource(input.url);
    } catch (err) {
      console.warn('[GeminiExtraction] Europe PMC lookup failed:', err);
      return { success: false, eligible: false, rejectionReason: COPY.extraction.paperLookupFailed, source: sourceName };
    }
    if (!resolution.ok) {
      return {
        success: false,
        eligible: false,
        errorType: resolution.reason,
        rejectionReason: UNRESOLVED_LINK_REASONS[resolution.reason],
        suggestedQuery: extractQueryFromInput(input.url),
        source: sourceName
      };
    }
    linkedPaper = resolution.paper;

    const screenedPaper = await screenPaper(
      linkedPaper.title,
      { doi: linkedPaper.doi, title: linkedPaper.title },
      sourceName,
      activePolicy
    );
    if (screenedPaper) return screenedPaper;
  }
  const paperFromLink = linkedPaper;

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
- Banned criteria: Studies matching [${activePolicy.bannedKeywords.join(', ')}] MUST be marked eligible=false.
- Grounding: add a "methodsExcerpt" string field to the routine with the paper's Methods / Interventions text copied VERBATIM (no paraphrase), up to 4000 characters, covering the intervention, dosing, sets, reps, timing and safety rules.
- Never mark a proposed widget as approved; approval is a human decision.`;

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
            `Analyze this attached PDF (${input.file.name}). First check the strict gatekeeper criteria. If interventional human science, extract the full routine.`
          ];
        } else if (paperFromLink) {
          promptParts = [
            SYSTEM_PROMPT,
            dynamicPolicyInstruction,
            `Analyze this paper: ${paperFromLink.citation}. Its full text, retrieved from Europe PMC, is between the markers below. Take every title, author, sample size and parameter from this text only. First check gatekeeper criteria, then extract the routine if eligible.`,
            `<<<PAPER FULL TEXT>>>\n${paperFromLink.fullText}\n<<<END PAPER FULL TEXT>>>`
          ];
        } else {
          promptParts = [
            SYSTEM_PROMPT,
            dynamicPolicyInstruction,
            `Analyze this paper text: ${input.text}. First check gatekeeper criteria, then extract the routine if eligible.`
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

        const validation = validateExtractedRoutine(parsed.routine);
        if (!validation.ok) {
          // Unusable model output is reported as a model failure, never shown as a routine
          throw new Error(`Gemini routine failed validation: ${validation.reason}`);
        }
        const rawRoutine = validation.routine;

        const normalizedSteps: RoutineStep[] = rawRoutine.steps.map((step: RoutineStep) => ({
          ...step,
          timing: resolveStepTiming(step)
        }));

        const routine: Routine = {
          ...rawRoutine,
          steps: normalizedSteps,
          version: rawRoutine.version || '1.0',
          changelog: rawRoutine.changelog && rawRoutine.changelog.length > 0
            ? rawRoutine.changelog
            : [
                {
                  version: '1.0',
                  date: new Date().toISOString(),
                  summary: 'Initial clinical routine extraction',
                  author: 'Gemini Multimodal Extraction'
                }
              ],
          dayHistory: [],
          initialSetsDone: {},
          initialFeedbackLogs: [],
          feedbackMetric: rawRoutine.feedbackMetric
            ? {
                ...rawRoutine.feedbackMetric,
                escalationThreshold: activePolicy.painEscalationThreshold,
                escalationMessage: activePolicy.escalationAlertMessage
              }
            : undefined,
          initialMessages: [
            {
              id: `${rawRoutine.id}-msg-1`,
              role: 'user',
              kind: 'file',
              content: sourceName,
              timestamp: COPY.assistant.timestampJustNow
            },
            {
              id: `${rawRoutine.id}-msg-2`,
              role: 'ai',
              kind: 'text',
              content: COPY.assistant.parsedSummary(rawRoutine.paper?.pages || 'the'),
              timestamp: COPY.assistant.timestampJustNow
            },
            {
              id: `${rawRoutine.id}-msg-3`,
              role: 'ai',
              kind: 'routine',
              content: rawRoutine.id,
              timestamp: COPY.assistant.timestampJustNow
            }
          ]
        };

        // Proposals are only registered for review once the user confirms the routine
        const validatedRoutine = await validateRoutineWidgets(routine);

        return {
          success: true,
          eligible: true,
          routine: validatedRoutine,
          sourceKind: (paperFromLink ? 'europe-pmc' : input.file ? 'pdf-upload' : 'pasted-text') as ExtractionSourceKind,
          source: sourceName
        };

        throw new Error('Gemini output missing routine or eligible field');
      }, EXTRACTION_PER_KEY_TIMEOUT_MS, { totalDeadlineMs: EXTRACTION_TOTAL_DEADLINE_MS });

      if (extracted) {
        logEvent('extraction_completed', {
          eligible: extracted.eligible,
          sourceKind: extracted.sourceKind ?? null
        });
        return extracted;
      }
    } catch (err) {
      console.error('[GeminiExtraction] Gemini extraction failed:', err);
      logEvent('extraction_model_failed', { inputKind: input.file ? 'pdf' : input.url ? 'link' : 'text' });
    }
  }

  // A real paper was supplied (link, PDF or pasted text). Never stand in a simulated routine for it:
  // when Gemini failed or is not configured, say the model is unavailable instead. The canned
  // routine below is only for local development, or a deliberate demo (ENABLE_DEMO_EXTRACTION=true).
  if (geminiKeys.length > 0 || linkedPaper || !isDemoExtractionAllowed()) {
    return {
      success: false,
      eligible: false,
      rejectionReason: COPY.extraction.modelUnavailable,
      source: sourceName
    };
  }

  // Development / demo mode: provides instant, calibrated routine extraction
  const fallbackRoutine = await validateRoutineWidgets(
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
    sourceKind: 'demo-fallback',
    source: sourceName
  };
}

/** The canned routine is allowed outside production, or when a demo deploy opts in. */
export function isDemoExtractionAllowed(): boolean {
  return process.env.ENABLE_DEMO_EXTRACTION === 'true' || process.env.NODE_ENV !== 'production';
}


