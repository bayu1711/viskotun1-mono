import React from 'react';
import { COPY } from '../../../data/copy';
import type { AIEngineType } from '../../../types/routine';
import { stripClinicalDisclaimer } from '../../../utils/disclaimer';
import { Icon } from '../../ui/Icon';
import { MarkdownContent } from '../../ui/MarkdownContent';
import { getEngineMeta } from '../engineMeta';

interface AnswerBubbleProps {
  content: string;
  engine?: AIEngineType;
  source?: string;
}

export function AnswerBubble({ content, engine, source }: AnswerBubbleProps) {
  const cleanContent = stripClinicalDisclaimer(content);
  const engineMeta = engine ? getEngineMeta(engine) : null;

  let badgeLabel: string = COPY.assistant.answerSource;
  if (engine === 'on-device-gemma' && engineMeta) {
    badgeLabel = `${engineMeta.label} · ${COPY.assistant.engines.onDeviceBadge}`;
  } else if (engine === 'server-gemma' && engineMeta) {
    badgeLabel = engineMeta.label;
  } else if ((engine === 'cloud-gemini' || engine === 'local-rules') && engineMeta) {
    badgeLabel = `${engineMeta.label} · ${source || COPY.assistant.answerSource}`;
  }

  return (
    <div className="max-w-bubble-wide rounded-bubble rounded-bl-md bg-white px-4 py-3 shadow-sm">
      <MarkdownContent content={cleanContent} />
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-ink/5 pt-1.5">
        <span className="inline-flex items-center gap-1 text-2xs font-medium text-ink/60">
          {engineMeta && <Icon icon={engineMeta.icon} size="xs" />}
          <span>{badgeLabel}</span>
        </span>
      </div>
    </div>
  );
}