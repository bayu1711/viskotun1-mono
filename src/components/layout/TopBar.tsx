import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { useAssistant } from '../../contexts/AssistantContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import { usePolicyLedger } from '../../contexts/PolicyLedgerContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { ROUTES } from '../../data/navigation';
import { greeting } from '../../utils/time';
import { Avatar } from '../ui/Avatar';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { LanguageSwitcher } from './LanguageSwitcher';

export function TopBar() {
  const pathname = usePathname();
  const { streak, resetToDefaults, openHowTo } = useRoutine();
  const { openAssistant } = useAssistant();
  const { user, isGuest, isAdmin, logout } = useAuth();
  const { openPolicyDrawer, isLiveFirestore } = usePolicyLedger();
  const { locale, copy } = useLocale();

  const displayName = user?.name || copy.auth.defaultGuestName;
  const displayInitials = user?.initials || copy.brand.initials;

  // The server clock is not in the viewer's timezone, so the greeting is only computed in the browser
  const [greetingText, setGreetingText] = useState<string | null>(null);
  useEffect(() => {
    setGreetingText(greeting(new Date(), copy.greeting));
  }, [copy]);

  return (
    <header className="mx-auto w-full max-w-6xl px-5 pt-5 lg:px-10 lg:pt-8">
      <div className="flex items-center gap-2 border-b border-ink pb-4 sm:gap-3">
        {/* Hidden on phones: the bottom tab bar handles navigation and the header needs the room. */}
        <Link href={ROUTES.landing} className="hidden min-h-11 min-w-11 items-center justify-center transition-opacity hover:opacity-85 sm:flex lg:hidden" aria-label={copy.brand.name}>
          <Image
            src={copy.brand.iconUrl}
            alt=""
            width={28}
            height={28}
            priority
            unoptimized
            className="h-7 w-7 object-contain"
          />
        </Link>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href={ROUTES.profile}
            aria-label={copy.shell.openProfile}
            title={copy.shell.openProfile}
            className={`group flex min-w-0 shrink-0 items-center gap-2.5 rounded-full transition-opacity hover:opacity-85 sm:shrink sm:pe-4 ${
              pathname === ROUTES.profile ? 'ring-2 ring-ink ring-offset-2 ring-offset-canvas' : ''
            }`}
          >
            <span className="shrink-0">
              <Avatar initials={displayInitials} />
            </span>
            {/* Phones show the avatar only; the name would collide with the header actions at 375px. */}
            <div className="hidden min-w-0 leading-tight sm:block">
              <p className="text-xs text-ink/70">{greetingText ?? '\u00a0'}</p>
              <p className="truncate text-sm font-medium group-hover:underline">{displayName}</p>
            </div>
          </Link>
          {isGuest ? (
            <Link
              href={ROUTES.login}
              className="inline-flex min-h-11 items-center whitespace-nowrap text-2xs font-semibold text-ink underline underline-offset-2 transition-colors hover:text-ink/80"
            >
              {copy.auth.signInToSyncBadge}
            </Link>
          ) : isAdmin ? (
            <Link
              href={ROUTES.admin}
              className="flex items-center gap-1 rounded-full border border-ink/20 bg-cream px-2 py-0.5 text-2xs font-semibold lowercase text-ink transition-colors hover:border-ink/40 hover:bg-cream/80"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-ink" />
              {copy.auth.adminBadge}
            </Link>
          ) : null}
        </div>

        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitcher variant="topbar" />

          {streak > 0 && (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-orange/15 px-3 py-1 text-xs font-semibold text-ink">
              <Icon icon={LocalFireDepartmentOutlinedIcon} size="xs" />
              {copy.shell.streak(streak)}
            </span>
          )}
        </div>

        {user && !isGuest && (
          <CircleButton label={copy.auth.signOut} onClick={logout} size={38}>
            <Icon icon={LogoutOutlinedIcon} size="md" />
          </CircleButton>
        )}

        <CircleButton label={copy.howTo.dialogLabel} onClick={openHowTo} size={38}>
          <Icon icon={HelpOutlineOutlinedIcon} size="md" />
        </CircleButton>

        {isAdmin && (
          <CircleButton label={copy.policyLedger.dialogLabel} onClick={openPolicyDrawer} size={38} className="relative">
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
          <CircleButton label={copy.shell.resetDemo} onClick={resetToDefaults} size={38}>
            <Icon icon={RestartAltOutlinedIcon} size="md" />
          </CircleButton>
        )}

        {pathname !== ROUTES.profile && (
          <CircleButton label={copy.shell.addPaper} onClick={() => openAssistant('upload')}>
            <Icon icon={AddIcon} size="lg" />
          </CircleButton>
        )}
      </div>
    </header>
  );
}