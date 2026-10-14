import { PAPER_LINK_PATTERN } from '../data/config';
import { COPY } from '../data/copy';
import type { Protocol } from '../types/protocol';

export function answerFor(protocol: Protocol, question: string) {
  const text = question.toLowerCase();
  const match = protocol.faqs.find((faq) => faq.keywords.some((keyword) => text.includes(keyword)));
  return match?.answer ?? COPY.assistant.noAnswer(protocol.shortTitle);
}

export function isPaperLink(value: string) {
  return PAPER_LINK_PATTERN.test(value);
}