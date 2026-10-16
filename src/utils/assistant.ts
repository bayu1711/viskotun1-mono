import { PAPER_LINK_PATTERN } from '../data/config';
import { COPY } from '../data/copy';
import type { Protocol } from '../types/protocol';

export function answerFor(protocol: Protocol, question: string): string {
  const text = question.toLowerCase();

  // 1. Check direct FAQ keyword matches
  if (Array.isArray(protocol.faqs)) {
    const match = protocol.faqs.find((faq) =>
      Array.isArray(faq.keywords) && faq.keywords.some((keyword) => text.includes(keyword.toLowerCase()))
    );
    if (match?.answer) {
      return match.answer;
    }
  }

  // 2. Safety, stop rules, and contraindications
  const safetyKeywords = ['stop', 'safety', 'danger', 'contraindication', 'adverse', 'risk', 'warning', 'harm', 'side effect', 'hurt', 'safe'];
  if (safetyKeywords.some((k) => text.includes(k)) && Array.isArray(protocol.contraindications) && protocol.contraindications.length > 0) {
    const stopRule = protocol.contraindications.find((item) => item.severity === 'stop');
    const cautions = protocol.contraindications.filter((item) => item.severity === 'caution');
    if (stopRule) {
      const cautionText = cautions.length > 0
        ? COPY.assistant.offlineAnswers.additionalPrecaution(cautions.map((c) => c.text).join(' '))
        : '';
      return COPY.assistant.offlineAnswers.safetyStopRule(stopRule.text, cautionText);
    }
    if (cautions.length > 0) {
      return COPY.assistant.offlineAnswers.studyPrecautions(cautions.map((c) => c.text).join(' '));
    }
  }

  // 3. Progression and advancement rules
  const progressionKeywords = ['progression', 'advance', 'progress', 'increase', 'load', 'level up', 'next phase', 'criteria', 'when to increase'];
  if (progressionKeywords.some((k) => text.includes(k)) && Array.isArray(protocol.progressionRules) && protocol.progressionRules.length > 0) {
    const rulesText = protocol.progressionRules.map((rule) => `${rule.condition} → ${rule.action}`).join('; ');
    return COPY.assistant.offlineAnswers.progressionCriteria(rulesText);
  }

  // 4. Routine, dosage, steps, sets, reps, frequency
  const routineKeywords = ['routine', 'plan', 'step', 'sets', 'reps', 'dosage', 'dose', 'frequency', 'how to', 'how many', 'daily', 'schedule', 'cadence'];
  if (routineKeywords.some((k) => text.includes(k)) && Array.isArray(protocol.steps) && protocol.steps.length > 0) {
    const stepSummary = protocol.steps
      .map((s) => `${s.action} (${s.sets} ${s.setLabel || COPY.task.defaultSetLabel}, ${s.frequency}${s.perSetLabel ? ' ' + s.perSetLabel : ''})`)
      .join('; ');
    return COPY.assistant.offlineAnswers.prescribedDailyRoutine(stepSummary);
  }

  // 5. Biofeedback tracking & escalation thresholds
  const feedbackKeywords = ['feedback', 'metric', 'symptom', 'pain', 'discomfort', 'log', 'threshold', 'scale', 'score', 'track', 'biofeedback'];
  if (feedbackKeywords.some((k) => text.includes(k)) && protocol.feedbackMetric) {
    const metric = protocol.feedbackMetric;
    const alertMsg = metric.escalationMessage ? ` ${metric.escalationMessage}` : '';
    return COPY.assistant.offlineAnswers.biofeedbackMetric(
      metric.name,
      metric.maxScore ?? 10,
      metric.escalationThreshold ?? 4,
      alertMsg
    );
  }

  // 6. Paper evidence, methodology, and citation
  const paperKeywords = ['paper', 'doi', 'authors', 'journal', 'study', 'evidence', 'participants', 'sample'];
  if (paperKeywords.some((k) => text.includes(k)) && protocol.paper) {
    return COPY.assistant.offlineAnswers.paperCitation(
      protocol.paper.title,
      protocol.paper.journal,
      protocol.paper.year,
      protocol.paper.authors,
      protocol.paper.sampleSize,
      protocol.paper.trialType
    );
  }

  return COPY.assistant.noAnswer(protocol.shortTitle);
}

export function isPaperLink(value: string) {
  return PAPER_LINK_PATTERN.test(value);
}