import React from 'react';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useAssistant } from '../../contexts/AssistantContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { ROUTES } from '../../data/navigation';
import { greeting } from '../../utils/time';
import { Avatar } from '../ui/Avatar';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';

export function TopBar() {
  const { streak } = useProtocol();
  const { openAssistant } = useAssistant();
  const { user, isGuest, logout } = useAuth();

  const displayName = user?.name || 'Guest Explorer';
  const displayInitials = user?.initials || 'ge';

  return (
    <header className="mx-auto w-full max-w-6xl px-5 pt-5 lg:px-10 lg:pt-8">
      <div className="flex items-center gap-3 border-b border-ink pb-4">
        <Avatar initials={displayInitials} />
        <div className="leading-tight">
          <p className="text-xs text-ink/45">{greeting()}</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{displayName}</p>
            {isGuest ? (
              <Link
                href={ROUTES.login}
                className="rounded-full border border-ink/15 bg-cream px-2 py-0.5 text-2xs font-medium lowercase text-ink transition-colors hover:bg-mint"
              >
                sign in to sync
              </Link>
            ) : (
              <span className="rounded-full border border-ink/15 bg-mint px-2 py-0.5 text-2xs font-medium lowercase text-ink">
                cloud synced
              </span>
            )}
          </div>
        </div>

        <p className="ml-auto text-sm lowercase text-ink/60">{COPY.shell.streak(streak)}</p>

        {user && !isGuest && (
          <CircleButton label={COPY.auth.signOut} onClick={logout} size={38}>
            <Icon icon={LogoutOutlinedIcon} size="md" />
          </CircleButton>
        )}

        <CircleButton label={COPY.shell.addPaper} onClick={() => openAssistant('upload')}>
          <Icon icon={AddIcon} size="lg" />
        </CircleButton>
      </div>
    </header>
  );
}