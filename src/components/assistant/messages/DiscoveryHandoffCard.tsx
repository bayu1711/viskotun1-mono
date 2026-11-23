'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import { useAssistant } from '../../../contexts/AssistantContext';
import { useLocale } from '../../../contexts/LocaleContext';
import { useRoutine } from '../../../contexts/RoutineContext';
import { ROUTES } from '../../../data/navigation';
import { Icon } from '../../ui/Icon';
import { IconTile } from '../../ui/IconTile';
import { PillButton } from '../../ui/PillButton';

interface DiscoveryHandoffCardProps {
  content: string;
}

export function DiscoveryHandoffCard({ content }: DiscoveryHandoffCardProps) {
  const router = useRouter();
  const { copy } = useLocale();
  const { setMode, closeAssistant } = useAssistant();
  const { askQuestion } = useRoutine();

  let topicQuery = '';
  try {
    if (content && content.startsWith('{')) {
      const parsed = JSON.parse(content) as { topicQuery?: string };
      topicQuery = parsed.topicQuery?.trim() ?? '';
    }
  } catch {
    topicQuery = '';
  }

  const t = copy.assistant.discoveryHandoff;

  const handleOpenDiscovery = () => {
    setMode('upload');
    if (topicQuery) {
      askQuestion(topicQuery, { forceDiscovery: true });
    }
  };

  const handleBrowseCommunity = () => {
    closeAssistant();
    router.push(`${ROUTES.community}?tab=explore`);
  };

  return (
    <div className="max-w-bubble-wide rounded-bubble rounded-bl-md border border-ink/10 bg-white px-4 py-3.5 shadow-sm space-y-3">
      <div className="flex items-start gap-2.5">
        <IconTile variant="plain" shape="circle" size={32} className="bg-mint shrink-0 mt-0.5">
          <Icon icon={TravelExploreOutlinedIcon} size="xs" className="text-ink" />
        </IconTile>
        <p className="text-xs sm:text-sm leading-relaxed text-ink">
          {topicQuery ? t.promptWithTopic(topicQuery) : t.promptGeneric}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 ps-10">
        <PillButton size="sm" variant="primary" onClick={handleOpenDiscovery}>
          <span>{topicQuery ? t.ctaWithTopic(topicQuery) : t.ctaGeneric}</span>
          <Icon icon={ArrowForwardIcon} size="xs" className="ms-1 rtl:rotate-180" />
        </PillButton>
        <button
          type="button"
          onClick={handleBrowseCommunity}
          className="text-2xs font-medium text-ink/65 hover:text-ink underline underline-offset-4 transition-colors cursor-pointer"
        >
          {t.browseCommunity}
        </button>
      </div>
    </div>
  );
}
