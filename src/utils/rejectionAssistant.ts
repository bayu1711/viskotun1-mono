import { COPY } from '../data/copy';

/** What a follow-up question about a declined paper is asking for. */
export type RejectionIntent = 'why' | 'criteria' | 'nonHuman';

export interface RejectionQuestionScope {
  /** In-scope topics detected in the question. Empty means the question is out of scope. */
  intents: RejectionIntent[];
  /** True when the question also reaches for the declined paper's own content (methods, dosing, results…). */
  asksAboutContent: boolean;
}

const INTENT_PATTERNS: Record<RejectionIntent, RegExp> = {
  why: /\b(why|reason|reject\w*|declin\w*|denied|refus\w*|gatekeeper|explain|wrong|problem)\b|not (accepted|allowed|suitable|eligible)/,
  criteria:
    /what (kind|type|sort|papers?|studies)|which (papers?|stud\w+)|instead|upload|criteria|polic(y|ies)|requirements?|eligib\w*|qualif\w*/,
  nonHuman:
    /\b(translate|extrapolat\w*|non-?human|in[- ]vitro)\b|still be used|\b(why|can|could|should|allow\w*|accept\w*|use\w*|suitab\w*|eligib\w*|reject\w*|declin\w*)\b.*\b(animals?|mouse|mice|rats?|human|humans|people|models?)\b|\b(animals?|mouse|mice|rats?|human|humans|people|models?)\b.*\b(allow\w*|accept\w*|use\w*|suitab\w*|eligib\w*|reject\w*|declin\w*|only|instead)\b/
};

/** Reaches for the declined paper's own substance, which the assistant must not discuss. */
const CONTENT_PATTERN =
  /summar\w*|abstract|methods?\b|results?\b|findings?\b|conclusions?\b|dos(e|age)\b|\bsets\b|\breps\b|\bsteps?\b|protocol|sample size|authors?\b|journal|how (do|to|many|much)|(tell me|what) .*\b(paper|study)\b.*\b(about|say|show|found)/;

export function classifyRejectionQuestion(question: string): RejectionQuestionScope {
  const text = question.toLowerCase();
  const intents = (Object.keys(INTENT_PATTERNS) as RejectionIntent[]).filter((intent) =>
    INTENT_PATTERNS[intent].test(text)
  );
  return { intents, asksAboutContent: CONTENT_PATTERN.test(text) };
}

export function isRejectionQuestionInScope(scope: RejectionQuestionScope): boolean {
  return scope.intents.length > 0;
}

/**
 * Deterministic answer for a follow-up about a declined paper. Only ever draws on the gatekeeper's
 * stated reason and the public acceptance criteria, never on the paper itself.
 */
export function answerForRejection(reason: string, question: string): string {
  const answers = COPY.assistant.rejection.answers;
  const scope = classifyRejectionQuestion(question);
  if (!isRejectionQuestionInScope(scope)) return answers.outOfScope;

  const parts: string[] = [];
  if (scope.intents.includes('why')) parts.push(`${answers.whyPrefix}${reason}`);
  if (scope.intents.includes('nonHuman')) parts.push(answers.nonHuman);
  if (scope.intents.includes('criteria')) parts.push(answers.criteria);
  if (scope.asksAboutContent) parts.push(answers.scopeNote);
  return parts.join('\n\n');
}
