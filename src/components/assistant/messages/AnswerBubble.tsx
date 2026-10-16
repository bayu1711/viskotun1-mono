import React from 'react';
import { COPY } from '../../../data/copy';
import type { AIEngineType } from '../../../types/routine';

interface AnswerBubbleProps {
  content: string;
  engine?: AIEngineType;
  source?: string;
}

export function AnswerBubble({ content, engine, source }: AnswerBubbleProps) {
  let badgeLabel: string = COPY.assistant.answerSource;
  if (engine === 'on-device-gemma') {
    badgeLabel = `${COPY.assistant.engines.onDeviceGemma} · ${COPY.assistant.engines.onDeviceBadge}`;
  } else if (engine === 'server-gemma') {
    badgeLabel = `${COPY.assistant.engines.serverGemma}`;
  } else if (engine === 'cloud-gemini') {
    badgeLabel = `${COPY.assistant.engines.cloudGemini} · ${source || COPY.assistant.answerSource}`;
  } else if (engine === 'local-rules') {
    badgeLabel = `${COPY.assistant.engines.localRules} · ${source || COPY.assistant.answerSource}`;
  }

  return (
    <div className="max-w-bubble-wide rounded-bubble rounded-bl-md bg-white px-4 py-3 shadow-sm">
      <p className="text-sm leading-relaxed text-ink">{content}</p>
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-ink/5 pt-1.5">
        <span className="text-2xs font-medium text-ink/45">
          {badgeLabel}
        </span>
      </div>
    </div>
  );
}