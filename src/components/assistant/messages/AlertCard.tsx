import React from 'react';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { useAssistant } from '../../../contexts/AssistantContext';
import { COPY } from '../../../data/copy';
import { Callout } from '../../feedback/Callout';
import { Icon } from '../../ui/Icon';
import { IconTile } from '../../ui/IconTile';

interface AlertCardProps {
  content: string;
}

export function AlertCard({ content }: AlertCardProps) {
  const { closeAssistant } = useAssistant();

  return (
    <Callout
      tone="blush"
      role="alert"
      icon={
      <IconTile variant="outline" shape="circle" size={28}>
          <Icon icon={PriorityHighIcon} size="xs" />
        </IconTile>
      }>
      
      <p>{content}</p>
      <button
        type="button"
        onClick={closeAssistant}
        className="mt-1 text-xs text-ink/60 underline underline-offset-2 hover:text-ink">
        
        {COPY.assistant.backToToday}
      </button>
    </Callout>);

}