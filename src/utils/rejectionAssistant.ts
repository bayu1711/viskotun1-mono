import { COPY } from '../data/copy';
import { SAMPLE_PAPERS } from '../data/samplePapers';
import { buildExternalSearchLinks, extractQueryFromInput, matchCommunityPapers } from './paperQuery';

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
  /summar\w*|abstract|methods?\b|results?\b|findings?\b|conclusions?\b|dos(e|age)\b|\bsets\b|\breps\b|\bsteps?\b|protocol|routine|sample size|authors?\b|journal|how (do|to|many|much)|(tell me|what) .*\b(paper|study)\b.*\b(about|say|show|found)/;

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

/** Checks whether a rejection reason stems from an unrecognized link or missing paper ID rather than a policy violation. */
export function isUnrecognizedLinkReason(reason: string): boolean {
  if (!reason) return false;
  return (
    reason.includes('No DOI') ||
    reason.includes('Europe PMC') ||
    reason === COPY.extraction.linkNotRecognized ||
    reason === COPY.extraction.paperNotFound ||
    reason === COPY.extraction.fullTextUnavailable
  );
}

/**
 * Provides helpful discovery guidance, matching community routines, and external database search links.
 */
export function answerForGuidance(question: string): string {
  const query = extractQueryFromInput(question);
  const matches = matchCommunityPapers(query, SAMPLE_PAPERS);
  const links = buildExternalSearchLinks(query);

  const lines: string[] = [
    'To build an executable routine, TrialN1 requires an interventional human study with an open-access DOI, PubMed ID, or PDF.'
  ];

  if (matches.length > 0) {
    const list = matches
      .slice(0, 3)
      .map((p) => `• **${p.shortTitle}**: ${p.domain} (${p.journal}, ${p.year}) — DOI: \`${p.doi}\``)
      .join('\n');
    lines.push(`\n### Recommended Community Routines:\n${list}\nYou can load any of these routines with 1 click from the community library!`);
  }

  lines.push(
    `\n### Search External Peer-Reviewed Databases:\n• [Search on PubMed (Clinical Trials)](${links.pubmed})\n• [Search on Europe PMC (Open Access)](${links.europePmc})\n• [Search on Google Scholar](${links.googleScholar})`
  );
  lines.push(
    '\n💡 **Tip:** Copy the DOI (e.g. `10.1177/1941738116631498`) or the PubMed URL from any study, paste it here, or upload the paper PDF directly.'
  );

  return lines.join('\n');
}

/**
 * Deterministic answer for a follow-up about a declined paper. Only ever draws on the gatekeeper's
 * stated reason and the public acceptance criteria, never on the paper itself.
 */
export function answerForRejection(reason: string, question: string): string {
  if (isUnrecognizedLinkReason(reason)) {
    return answerForGuidance(question);
  }

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
