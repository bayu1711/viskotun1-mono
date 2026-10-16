import React from 'react';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { Callout } from '../feedback/Callout';
import { Icon } from '../ui/Icon';
import { IconTile } from '../ui/IconTile';

export function MissingDataBanner() {
  const { protocol, missingDataFlagEnabled } = useProtocol();
  const flag = protocol.missingDataFlags[0];

  if (!missingDataFlagEnabled || !flag) return null;

  const step = protocol.steps.find((item) => item.id === flag.stepId);

  return (
    <Callout
      tone="cream"
      role="alert"
      icon={
      <IconTile variant="outline" shape="circle" size={32}>
          <Icon icon={PriorityHighIcon} size="sm" />
        </IconTile>
      }>
      
      <p>
        {COPY.missingData.caution} <span className="">{step?.action ?? flag.parameter}</span>.
      </p>
      <p className="text-ink/50">{COPY.missingData.fallback}</p>
    </Callout>);

}