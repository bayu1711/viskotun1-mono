import React from 'react';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import type { ChatMessage } from '../../../types/protocol';
import { Icon } from '../../ui/Icon';
import { IconTile } from '../../ui/IconTile';

interface UserFileBubbleProps {
  message: ChatMessage;
}

export function UserFileBubble({ message }: UserFileBubbleProps) {
  return (
    <div className="flex justify-end">
      <div className="flex max-w-bubble items-center gap-3 rounded-callout bg-ink p-3 pr-5 text-white">
        <IconTile variant="outline-light" size={40}>
          <Icon icon={DescriptionOutlinedIcon} size="md" />
        </IconTile>
        <div className="min-w-0">
          <p className="truncate text-sm">{message.content}</p>
          <p className="text-xs text-white/45">{message.timestamp}</p>
        </div>
      </div>
    </div>);

}