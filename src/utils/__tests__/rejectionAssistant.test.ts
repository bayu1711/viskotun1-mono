import { describe, expect, it } from 'vitest';
import { COPY } from '../../data/copy';
import {
  answerForRejection,
  classifyRejectionQuestion,
  isRejectionQuestionInScope
} from '../rejectionAssistant';

const SAMPLE_REASON =
  "The study provided is an animal model investigation using mice ('Weight Pulling: A Novel Mouse Model of Human Progressive Resistance Exercise'). Per the strict gatekeeper criteria, studies involving non-human subjects are ineligible.";

describe('rejectionAssistant', () => {
  it('classifies "why was this rejected" questions as in-scope with why intent', () => {
    const scope = classifyRejectionQuestion('Why was this paper rejected?');
    expect(isRejectionQuestionInScope(scope)).toBe(true);
    expect(scope.intents).toContain('why');
    expect(scope.asksAboutContent).toBe(false);

    const answer = answerForRejection(SAMPLE_REASON, 'Why was this paper rejected?');
    expect(answer).toContain(SAMPLE_REASON);
  });

  it('explains non-human model suitability when asked if mouse or animal studies can be used', () => {
    const question = COPY.assistant.rejection.suggestions.nonHuman;
    const scope = classifyRejectionQuestion(question);
    expect(isRejectionQuestionInScope(scope)).toBe(true);
    expect(scope.intents).toContain('nonHuman');

    const answer = answerForRejection(SAMPLE_REASON, question);
    expect(answer).toContain(COPY.assistant.rejection.answers.nonHuman);
  });

  it('explains eligibility criteria when asked what kind of paper to upload instead', () => {
    const question = COPY.assistant.rejection.suggestions.whatToUpload;
    const scope = classifyRejectionQuestion(question);
    expect(isRejectionQuestionInScope(scope)).toBe(true);
    expect(scope.intents).toContain('criteria');

    const answer = answerForRejection(SAMPLE_REASON, question);
    expect(answer).toContain(COPY.assistant.rejection.answers.criteria);
  });

  it('refuses questions about the rejected paper itself (methods, results, findings, dosing)', () => {
    const contentQuestions = [
      'Summarize the findings of this paper',
      'What were the results for the mice in this study?',
      'How much weight did the mice pull in the methods section?',
      'What sets and reps did the authors test?',
      'What did the study conclude?'
    ];

    for (const q of contentQuestions) {
      const scope = classifyRejectionQuestion(q);
      expect(isRejectionQuestionInScope(scope)).toBe(false);
      expect(answerForRejection(SAMPLE_REASON, q)).toBe(
        COPY.assistant.rejection.answers.outOfScope
      );
    }
  });

  it('answers the suitability portion and appends a scope boundary note for mixed questions', () => {
    const mixed = 'Why was this paper rejected and what were its results?';
    const scope = classifyRejectionQuestion(mixed);
    expect(isRejectionQuestionInScope(scope)).toBe(true);
    expect(scope.intents).toContain('why');
    expect(scope.asksAboutContent).toBe(true);

    const answer = answerForRejection(SAMPLE_REASON, mixed);
    expect(answer).toContain(SAMPLE_REASON);
    expect(answer).toContain(COPY.assistant.rejection.answers.scopeNote);
  });
});
