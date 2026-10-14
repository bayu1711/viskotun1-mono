import React from 'react';
import { COPY } from '../../../data/copy';

interface AnswerBubbleProps {
  content: string;
}

export function AnswerBubble({ content }: AnswerBubbleProps) {
  return (
    <div className="max-w-bubble-wide rounded-bubble rounded-bl-md bg-white px-4 py-3">
      <p className="text-sm leading-relaxed">{content}</p>
      <p className="mt-2 text-2xs lowercase text-ink/40">{COPY.assistant.answerSource}</p>
    </div>);

}