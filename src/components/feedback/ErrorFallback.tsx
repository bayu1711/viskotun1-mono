import React from 'react';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { COPY } from '../../data/copy';
import { Icon } from '../ui/Icon';
import { IconTile } from '../ui/IconTile';
import { PillButton } from '../ui/PillButton';

interface ErrorFallbackProps {
  onRetry: () => void;
}

export function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pt-6 lg:px-10 lg:pt-8">
      <div role="alert" className="flex flex-col items-center rounded-panel bg-blush px-6 py-12 text-center">
        <IconTile variant="outline" shape="circle" size={48}>
          <Icon icon={ErrorOutlineIcon} size="lg" />
        </IconTile>
        <h1 className="mt-4 text-2xl">{COPY.errors.boundaryTitle}</h1>
        <p className="mt-1 text-sm text-ink/60">{COPY.errors.boundaryBody}</p>
        <PillButton size="sm" className="mt-6" onClick={onRetry}>
          {COPY.errors.retry}
        </PillButton>
      </div>
    </div>);

}