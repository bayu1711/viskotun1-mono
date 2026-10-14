import React from 'react';
import { IconTile } from './IconTile';

interface AvatarProps {
  initials: string;
}

/** Decorative initials avatar — pair with a visible name. */
export function Avatar({ initials }: AvatarProps) {
  return (
    <IconTile variant="plain" shape="circle" size={40} className="bg-cream text-sm font-medium">
      {initials}
    </IconTile>);

}