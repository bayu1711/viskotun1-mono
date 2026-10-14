import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { Callout } from '../../feedback/Callout';
import { Icon } from '../../ui/Icon';
import { IconTile } from '../../ui/IconTile';

interface ConfirmationCardProps {
  content: string;
}

export function ConfirmationCard({ content }: ConfirmationCardProps) {
  return (
    <Callout
      tone="mint"
      role="status"
      icon={
      <IconTile variant="solid" shape="circle" size={28}>
          <Icon icon={CheckIcon} size="xs" />
        </IconTile>
      }>
      
      {content}
    </Callout>);

}