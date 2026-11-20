import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { useAssistant } from '../../contexts/AssistantContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import { usePolicyLedger } from '../../contexts/PolicyLedgerContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { ROUTES } from '../../data/navigation';
import { greeting } from '../../utils/time';
import { Avatar } from '../ui/Avatar';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { LanguageSwitcher } from './LanguageSwitcher';

export function TopBar() {
  const pathname = usePathname();
  const { streak, resetToDefaults, openHowTo, lifestyleProfile } = useRoutine();
  const { openAssistant, openLifestyleTuning } = useAssistant();
  const { user, isGuest, isAdmin, logout } = useAuth();
  const { openPolicyDrawer, isLiveFirestore } = usePolicyLedger();
  const { locale, copy } = useLocale();

  const displayName = user?.name || copy.auth.defaultGuestName;
  const displayInitials = user?.initials || copy.brand.initials;

  const countryCode = lifestyleProfile?.region?.countryCode || 'AE';
  const regionLabel =
    lifestyleProfile?.region?.city || lifestyleProfile?.region?.countryName || 'Abu Dhabi';
  const tagCount = lifestyleProfile?.activeTags?.length ?? 0;

  // The server clock is not in the viewer's timezone, so the greeting is only computed in the browser
  const [greetingText, setGreetingText] = useState<string | null>(null);
  useEffect(() => {
    setGreetingText(locale === 'ar' ? 'مرحباً بك،' : greeting());
  }, [locale]);

  return (
    <header className="mx-auto w-full max-w-6xl px-5 pt-5 lg:px-10 lg:pt-8">
      <div className="flex items-center gap-3 border-b border-ink pb-4">
        <Link href={ROUTES.landing} className="flex min-h-11 min-w-11 items-center justify-center hover:opacity-85 transition-opacity lg:hidden" aria-label={copy.brand.name}>
          <Image
            src={COPY.brand.iconUrl}
            alt={copy.brand.name}
            width={28}
            height={28}
            priority
            unoptimized
            className="h-7 w-7 object-contain"
          />
        </Link>
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={ROUTES.profile}
            aria-label={copy.shell.openProfile}
            title={copy.shell.openProfile}
            className={`group flex min-w-0 items-center gap-2.5 rounded-full pr-1 transition-opacity hover:opacity-85 ${
              pathname === ROUTES.profile ? 'ring-2 ring-ink ring-offset-2 ring-offset-canvas' : ''
            }`}
          >
            <Avatar initials={displayInitials} />
            <div className="min-w-0 leading-tight">
              <p className="hidden text-xs text-ink/60 sm:block">{greetingText ?? '\u00a0'}</p>
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
            <span className="flex items-center gap-1 rounded-full border border-ink/20 bg-cream px-2 py-0.5 text-2xs font-semibold lowercase text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-ink" />
              {copy.auth.adminBadge}
            </span>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher variant="topbar" />

          <button
            type="button"
            onClick={openLifestyleTuning}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-ink/20 bg-cream/70 hover:bg-cream px-2.5 py-1 text-xs font-medium text-ink transition-colors cursor-pointer"
            title={copy.lifestyleTuning.tuneButton}
            aria-label={copy.lifestyleTuning.tuneButton}
          >
            <Icon
              icon={lifestyleProfile?.region?.countryCode ? LocationOnOutlinedIcon : PublicOutlinedIcon}
              size="xs"
              className="text-ink/70"
            />
            <span className="font-mono text-3xs font-semibold uppercase sm:hidden">
              {countryCode}
            </span>
            <span className="hidden sm:inline font-semibold">
              {regionLabel}
            </span>
            <span className="text-2xs text-ink/65">
              · {tagCount > 0 ? `${tagCount} active` : 'Tune'}
            </span>
          </button>

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