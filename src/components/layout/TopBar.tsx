import React from 'react';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { useAssistant } from '../../contexts/AssistantContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePolicyLedger } from '../../contexts/PolicyLedgerContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { ROUTES } from '../../data/navigation';
import { greeting } from '../../utils/time';
import { Avatar } from '../ui/Avatar';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';

export function TopBar() {
  const { streak, resetToDefaults, openHowTo } = useRoutine();
  const { openAssistant } = useAssistant();
  const { user, isGuest, isAdmin, logout } = useAuth();
  const { openPolicyDrawer, isLiveFirestore } = usePolicyLedger();

  const displayName = user?.name || COPY.auth.defaultGuestName;
  const displayInitials = user?.initials || COPY.brand.initials;

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
                className="rounded-full border border-ink/15 bg-cream px-2 py-0.5 text-2xs font-medium text-ink transition-colors hover:bg-mint"
              >
                {COPY.auth.signInToSyncBadge}
              </Link>
            ) : isAdmin ? (
              <span className="flex items-center gap-1 rounded-full border border-ink/20 bg-cream px-2 py-0.5 text-2xs font-semibold lowercase text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-ink" />
                {COPY.auth.adminBadge}
              </span>
            ) : null}
          </div>
        </div>

        <p className="ml-auto text-sm text-ink/60">{COPY.shell.streak(streak)}</p>

        {user && !isGuest && (
          <CircleButton label={COPY.auth.signOut} onClick={logout} size={38}>
            <Icon icon={LogoutOutlinedIcon} size="md" />
          </CircleButton>
        )}

        <CircleButton label={COPY.howTo.dialogLabel} onClick={openHowTo} size={38}>
          <Icon icon={HelpOutlineOutlinedIcon} size="md" />
        </CircleButton>

        {isAdmin && (
          <CircleButton label={COPY.policyLedger.dialogLabel} onClick={openPolicyDrawer} size={38} className="relative">
            <Icon icon={ShieldOutlinedIcon} size="md" />
            {isLiveFirestore && (
              <span
                className="absolute right-1 top-1 h-2 w-2 rounded-full border border-ink bg-mint"
                aria-hidden="true"
              />
            )}
          </CircleButton>
        )}

        {isAdmin && (
          <CircleButton label={COPY.shell.resetDemo} onClick={resetToDefaults} size={38}>
            <Icon icon={RestartAltOutlinedIcon} size="md" />
          </CircleButton>
        )}

        <CircleButton label={COPY.shell.addPaper} onClick={() => openAssistant('upload')}>
          <Icon icon={AddIcon} size="lg" />
        </CircleButton>
      </div>
    </header>
  );
}