import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

  // The server clock is not in the viewer's timezone, so the greeting is only computed in the browser
  const [greetingText, setGreetingText] = useState<string | null>(null);
  useEffect(() => {
    setGreetingText(greeting());
  }, []);

  return (
    <header className="mx-auto w-full max-w-6xl px-5 pt-5 lg:px-10 lg:pt-8">
      <div className="flex items-center gap-3 border-b border-ink pb-4">
        <Link href={ROUTES.routine} className="flex min-h-11 min-w-11 items-center justify-center hover:opacity-85 transition-opacity lg:hidden" aria-label={COPY.brand.name}>
          <Image
            src={COPY.brand.iconUrl}
            alt={COPY.brand.name}
            width={28}
            height={28}
            priority
            unoptimized
            className="h-7 w-7 object-contain"
          />
        </Link>
        <Avatar initials={displayInitials} />
        <div className="min-w-0 leading-tight">
          <p className="hidden text-xs text-ink/60 sm:block">{greetingText ?? ' '}</p>
          <div className="flex flex-wrap items-center gap-x-2">
            <p className="truncate text-sm font-medium">{displayName}</p>
            {isGuest ? (
              <Link
                href={ROUTES.login}
                className="inline-flex min-h-11 items-center whitespace-nowrap text-2xs font-semibold text-ink underline underline-offset-2 transition-colors hover:text-ink/80"
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

        <div className="ml-auto">
          {streak > 0 && (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-orange/15 px-3 py-1 text-xs font-semibold text-ink">
              <span aria-hidden="true">🔥</span>
              {COPY.shell.streak(streak)}
            </span>
          )}
        </div>

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