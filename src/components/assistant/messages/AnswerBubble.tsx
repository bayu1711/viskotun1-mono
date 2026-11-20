import React from 'react';
import type { AIEngineType } from '../../../types/routine';
import { stripClinicalDisclaimer } from '../../../utils/disclaimer';
import { Icon } from '../../ui/Icon';
import { MarkdownContent } from '../../ui/MarkdownContent';
import { getEngineMeta } from '../engineMeta';

import { useLocale } from '../../../contexts/LocaleContext';
interface AnswerBubbleProps {
  content: string;
  engine?: AIEngineType;
  source?: string;
}

export function AnswerBubble({ content, engine, source }: AnswerBubbleProps) {
  const { copy } = useLocale();
  const cleanContent = stripClinicalDisclaimer(content);
  const isCloudGemini = engine === 'cloud-gemini';
  const engineMeta = engine && !isCloudGemini ? getEngineMeta(engine) : null;

  let badgeLabel: string = source || copy.assistant.answerSource;
  if (engine === 'on-device-gemma' && engineMeta) {
    badgeLabel = `${engineMeta.label} · ${copy.assistant.engines.onDeviceBadge}`;
  } else if (engine === 'server-gemma' && engineMeta) {
    badgeLabel = engineMeta.label;
  } else if (engine === 'local-rules' && engineMeta) {
    badgeLabel = `${engineMeta.label} · ${source || copy.assistant.answerSource}`;
  } else if (isCloudGemini) {
    badgeLabel = source || copy.assistant.answerSource;
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