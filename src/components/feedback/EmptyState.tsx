import React from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import { cn } from '../../utils/cn';
import { Icon } from '../ui/Icon';
import { IconTile } from '../ui/IconTile';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: SvgIconComponent;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center rounded-tile border border-dashed border-ink/20 px-4 py-8 text-center',
        className
      )}>
      
      {icon &&
      <IconTile variant="dashed" shape="circle" size={40} className="mb-3 text-ink/60">
          <Icon icon={icon} size="md" />
        </IconTile>
      }
      <p className="text-sm text-ink/60">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs text-ink/60">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>);

}