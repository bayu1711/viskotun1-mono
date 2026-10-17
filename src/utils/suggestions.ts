import { COPY } from '../data/copy';
import type { ChatMessage, Routine, Protocol } from '../types/routine';

/**
 * Normalizes question strings for comparison (lowercased, alphanumeric only).
 */
export function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .replace(/[×✕✖]/g, 'x')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Determines whether a candidate question has already been asked in the conversation.
 */
export function hasQuestionBeenAsked(candidate: string, askedQuestions: string[]): boolean {
  const normCandidate = normalizeQuestion(candidate);
  if (!normCandidate) return false;

  return askedQuestions.some((asked) => {
    const normAsked = normalizeQuestion(asked);
    if (!normAsked) return false;
    // Exact normalized match or significant substring containment
    return (
      normAsked === normCandidate ||
      normAsked.includes(normCandidate) ||
      normCandidate.includes(normAsked)
    );
  });
}

/**
 * Computes dynamic, relevant suggested question chips for the active routine assistant.
 *
 * Rules:
 * 1. Any question already asked by the user in this conversation is removed.
 * 2. Unasked study-specific FAQs from the published paper are prioritized.
 * 3. Contextual follow-up questions are derived from the latest AI response topic
 *    (e.g. after dosing info -> progression/safety; after pain/safety -> biofeedback).
 * 4. General study inquiries (safety, progression, biofeedback, missing data, citation)
 *    provide rich follow-ups so chips adapt continuously across the conversation.
 */
export function getDynamicSuggestions(
  protocol?: Routine | Protocol | null,
  messages: ChatMessage[] = [],
  maxSuggestions = 4
): string[] {
  if (!protocol) return [];

  // 1. Collect all user-asked messages
  const userQuestions = messages
    .filter((m) => m.role === 'user' && m.kind !== 'file')
    .map((m) => m.content);

  // 2. Unasked FAQs from the study
  const unaskedFaqs = (protocol.faqs || [])
    .map((f) => f.question)
    .filter((q) => !hasQuestionBeenAsked(q, userQuestions));

  // 3. Find the latest AI response to understand the active topic
  const latestAiMessage = [...messages].reverse().find((m) => m.role === 'ai' && m.kind === 'answer');
  const lastContent = (latestAiMessage?.content || '').toLowerCase();

  // 4. Topic candidate questions
  const safetyQuestion = COPY.assistant.suggestions.safetyRules;
  const progressionQuestion = COPY.assistant.suggestions.progressionCriteria;
  const biofeedbackQuestion = COPY.assistant.suggestions.biofeedbackLog(protocol.feedbackMetric?.name);
  const biofeedbackEscalation = COPY.assistant.suggestions.biofeedbackEscalation;
  const scheduleQuestion = COPY.assistant.suggestions.routineSchedule;
  const missingDataQuestion =
    protocol.missingDataFlags?.length || protocol.steps?.some((s) => s.inferred)
      ? COPY.assistant.suggestions.missingData
      : null;
  const citationQuestion = protocol.paper ? COPY.assistant.suggestions.trialCitation : null;

  // Step-specific candidate questions
  const stepQuestions: string[] = (protocol.steps || [])
    .slice(0, 2)
    .map((s) => COPY.assistant.suggestions.stepDetails(s.action));

  // 5. Prioritize contextual follow-ups based on what was just answered
  const contextualFollowUps: string[] = [];

  if (
    lastContent.includes('rep') ||
    lastContent.includes('set') ||
    lastContent.includes('dose') ||
    lastContent.includes('routine')
  ) {
    // If just discussed routine/sets/reps: suggest progression, then safety
    contextualFollowUps.push(progressionQuestion, safetyQuestion, biofeedbackQuestion);
  } else if (
    lastContent.includes('pain') ||
    lastContent.includes('discomfort') ||
    lastContent.includes('stop') ||
    lastContent.includes('caution')
  ) {
    // If just discussed safety/pain/discomfort: suggest biofeedback & escalation lockout
    contextualFollowUps.push(biofeedbackQuestion, biofeedbackEscalation, progressionQuestion);
  } else if (
    lastContent.includes('progress') ||
    lastContent.includes('advance') ||
    lastContent.includes('increase') ||
    lastContent.includes('load')
  ) {
    // If just discussed progression: suggest safety stop rules & biofeedback
    contextualFollowUps.push(safetyQuestion, biofeedbackQuestion, biofeedbackEscalation);
  } else if (
    lastContent.includes('feedback') ||
    lastContent.includes('metric') ||
    lastContent.includes('score')
  ) {
    // If just discussed feedback: suggest escalation pause rule & progression
    contextualFollowUps.push(biofeedbackEscalation, progressionQuestion, safetyQuestion);
  } else if (
    lastContent.includes('omitted') ||
    lastContent.includes('inferred') ||
    lastContent.includes('default') ||
    lastContent.includes('lineage')
  ) {
    // If just discussed missing parameters: suggest routine schedule & trial citation
    contextualFollowUps.push(scheduleQuestion, ...(citationQuestion ? [citationQuestion] : []));
  } else if (
    lastContent.includes('trial') ||
    lastContent.includes('authors') ||
    lastContent.includes('published')
  ) {
    // If just discussed paper citation: suggest schedule & safety
    contextualFollowUps.push(scheduleQuestion, safetyQuestion, progressionQuestion);
  } else {
    // General sequence
    contextualFollowUps.push(
      safetyQuestion,
      progressionQuestion,
      biofeedbackQuestion,
      scheduleQuestion
    );
  }

  // 6. Assemble candidate pool
  const candidatePool = [
    ...unaskedFaqs,
    ...contextualFollowUps,
    safetyQuestion,
    progressionQuestion,
    biofeedbackQuestion,
    scheduleQuestion,
    ...(missingDataQuestion ? [missingDataQuestion] : []),
    ...(citationQuestion ? [citationQuestion] : []),
    ...stepQuestions
  ];

  // 7. Filter out anything already asked and remove duplicates
  const finalSuggestions: string[] = [];
  const seenNorm = new Set<string>();

  for (const candidate of candidatePool) {
    if (!candidate) continue;
    const norm = normalizeQuestion(candidate);
    if (seenNorm.has(norm)) continue;
    if (hasQuestionBeenAsked(candidate, userQuestions)) continue;

    seenNorm.add(norm);
    finalSuggestions.push(candidate);

    if (finalSuggestions.length >= maxSuggestions) {
      break;
    }
  }

  return finalSuggestions;
}
