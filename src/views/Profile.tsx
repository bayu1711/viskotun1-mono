'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CheckIcon from '@mui/icons-material/Check';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import { toast } from 'sonner';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { AccountControlsPanel } from '../components/profile/AccountControlsPanel';
import { Avatar } from '../components/ui/Avatar';
import { AvailableWindowsEditor } from '../components/ui/AvailableWindowsEditor';
import { Icon } from '../components/ui/Icon';
import { Panel } from '../components/ui/Panel';
import { PillButton, pillClassName } from '../components/ui/PillButton';
import { SectionHeading } from '../components/ui/SectionHeading';
import { SegmentedTabs } from '../components/ui/SegmentedTabs';
import { useAssistant } from '../contexts/AssistantContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { useRoutine } from '../contexts/RoutineContext';
import {
  type AppLocale,
  type SecondaryLanguage,
  getLocaleMeta,
  resolveLanguagePair
} from '../data/locales';
import { ROUTES } from '../data/navigation';
import type {
  ActivityBaseline,
  BiologicalSex,
  CulturalRhythmId,
  SmokingStatus,
  UserLifestyleProfile,
  WorkPattern
} from '../types/auth';
import type { AvailabilityMode, AvailableTimeWindow } from '../types/schedule';
import { cn } from '../utils/cn';
import { resolveCountryCodeFromInput } from '../utils/geo';
import {
  CULTURAL_RHYTHM_KEYS,
  deriveClinicalFocus,
  deriveLifestyleCohort,
  getRegionalAvailabilityPresets,
  resolveCulturalRhythms,
  sanitizeAge,
  syncLifestyleActiveTags
} from '../utils/profile';
import {
  DEFAULT_AVAILABLE_WINDOWS,
  formatAvailabilitySummary,
  normalizeAvailableWindows
} from '../utils/schedule';
import { formatRoutineTitle } from '../utils/text';

const REGION_PRESETS = [
  { countryCode: 'AE', countryName: 'United Arab Emirates', defaultCity: 'Abu Dhabi' },
  { countryCode: 'SA', countryName: 'Saudi Arabia', defaultCity: 'Riyadh' },
  { countryCode: 'GB', countryName: 'United Kingdom', defaultCity: 'London' },
  { countryCode: 'US', countryName: 'United States', defaultCity: 'New York' }
] as const;

const SEX_KEYS: BiologicalSex[] = ['female', 'male', 'other', 'prefer_not_to_say'];
const WORK_KEYS: WorkPattern[] = ['standard', 'shift_work', 'desk_sedentary', 'frequent_travel', 'flexible'];
const ACTIVITY_KEYS: ActivityBaseline[] = ['sedentary', 'light', 'moderate', 'active'];
const SMOKING_KEYS: SmokingStatus[] = [
  'non_smoker',
  'midwakh_dokha',
  'shisha_waterpipe',
  'cigarettes',
  'vape',
  'former_smoker',
  'other'
];
const CLIMATE_KEYS: Array<NonNullable<UserLifestyleProfile['climateSensitivity']>> = [
  'summer_heat',
  'moderate',
  'cold_climate'
];

interface OptionChipGroupProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T | undefined;
  labels: Record<T, string>;
  onChange: (next: T) => void;
}

function OptionChipGroup<T extends string>({
  label,
  options,
  value,
  labels,
  onChange
}: OptionChipGroupProps<T>) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-ink/80">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                active
                  ? 'border-ink bg-ink text-white'
                  : 'border-ink/15 bg-canvas/70 text-ink hover:border-ink/40 hover:bg-cream/60'
              )}
            >
              {active && <Icon icon={CheckIcon} size="xs" />}
              <span>{labels[opt]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProfilePage() {
  const {
    user,
    isGuest,
    isLoading,
    userProfile,
    updateUserProfile,
    lifestyleProfile,
    updateLifestyleProfile,
    sendPasswordReset,
    logout
  } = useAuth();
  const { openLifestyleTuning } = useAssistant();
  const { routine, allRoutines, storedLogsCount } = useRoutine();
  const { copy, isRtl, locale, supportedLocales, setLocale } = useLocale();
  const t = copy.profile;

  const [displayName, setDisplayName] = useState('');
  const [ageInput, setAgeInput] = useState('');
  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex | undefined>(undefined);
  const [availabilityMode, setAvailabilityMode] = useState<AvailabilityMode>('windows');
  const [availableWindows, setAvailableWindows] = useState<AvailableTimeWindow[]>([
    ...DEFAULT_AVAILABLE_WINDOWS
  ]);
  const [clinicalGoals, setClinicalGoals] = useState('');
  const [isGoalsCustom, setIsGoalsCustom] = useState(false);
  const [primaryLanguage, setPrimaryLanguage] = useState<AppLocale>('en');
  const [secondaryLanguage, setSecondaryLanguage] = useState<SecondaryLanguage>('ar');
  const [reminderNotificationsEnabled, setReminderNotificationsEnabled] = useState(true);
  const [communityCohortOptIn, setCommunityCohortOptIn] = useState(true);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [activeTab, setActiveTab] = useState<'account' | 'lifestyle'>('account');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'lifestyle' || tabParam === 'account') {
        setActiveTab(tabParam);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  const handleTabChange = (next: 'account' | 'lifestyle') => {
    setActiveTab(next);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', next);
      window.history.replaceState(null, '', url.toString());
    } catch {
      // Ignore history errors
    }
  };

  const [countryCode, setCountryCode] = useState('AE');
  const [countryName, setCountryName] = useState('United Arab Emirates');
  const [city, setCity] = useState('Abu Dhabi');
  const [workPattern, setWorkPattern] = useState<WorkPattern>('standard');
  const [activityBaseline, setActivityBaseline] = useState<ActivityBaseline>('moderate');
  const [smokingStatus, setSmokingStatus] = useState<SmokingStatus>('non_smoker');
  const [climateSensitivity, setClimateSensitivity] =
    useState<NonNullable<UserLifestyleProfile['climateSensitivity']>>('moderate');
  const [culturalRhythms, setCulturalRhythms] = useState<CulturalRhythmId[]>([]);
  const [cautions, setCautions] = useState<string[]>([]);

  // Hydrate form state whenever stored profile loads/updates externally (e.g., via AI tuning or sync)
  useEffect(() => {
    setDisplayName(userProfile.displayName || (user && !user.isGuest ? user.name : '') || '');
    setAgeInput(userProfile.age !== undefined ? String(userProfile.age) : '');
    setBiologicalSex(userProfile.biologicalSex);
    setAvailabilityMode(userProfile.availabilityMode === 'anytime' ? 'anytime' : 'windows');
    const hydratedWindows = normalizeAvailableWindows(userProfile.availableWindows);
    setAvailableWindows(
      hydratedWindows.length > 0 ? hydratedWindows : [...DEFAULT_AVAILABLE_WINDOWS]
    );
    if (userProfile.clinicalGoals) {
      setClinicalGoals(userProfile.clinicalGoals);
      setIsGoalsCustom(true);
    } else {
      setIsGoalsCustom(false);
    }
    const resolvedPair = resolveLanguagePair(
      userProfile.primaryLanguage,
      userProfile.secondaryLanguage
    );
    setPrimaryLanguage(resolvedPair.primary);
    setSecondaryLanguage(resolvedPair.secondary ?? 'none');
    setReminderNotificationsEnabled(userProfile.reminderNotificationsEnabled ?? true);
    setCommunityCohortOptIn(userProfile.communityCohortOptIn ?? true);
  }, [userProfile, user]);

  useEffect(() => {
    setCountryCode(lifestyleProfile.region.countryCode || 'AE');
    setCountryName(lifestyleProfile.region.countryName || 'United Arab Emirates');
    setCity(lifestyleProfile.region.city || '');
    setWorkPattern(lifestyleProfile.workPattern || 'standard');
    setActivityBaseline(lifestyleProfile.activityBaseline || 'moderate');
    setSmokingStatus(lifestyleProfile.smokingStatus || 'non_smoker');
    setClimateSensitivity(lifestyleProfile.climateSensitivity || 'moderate');
    setCulturalRhythms(resolveCulturalRhythms(lifestyleProfile));
    setCautions(lifestyleProfile.physicalCautions || []);
  }, [lifestyleProfile]);

  const isRamadanObserver = culturalRhythms.includes('ramadan_fasting');
  const draftLifestyle: Partial<UserLifestyleProfile> = {
    ...lifestyleProfile,
    workPattern,
    activityBaseline,
    smokingStatus,
    climateSensitivity,
    culturalRhythms,
    isRamadanFastingObserver: isRamadanObserver,
    physicalCautions: cautions
  };
  const previewTags = syncLifestyleActiveTags(draftLifestyle);
  const previewCohort = deriveLifestyleCohort(draftLifestyle);
  const parsedAge = sanitizeAge(ageInput);
  const generatedFocus = deriveClinicalFocus(draftLifestyle, {
    age: parsedAge,
    routineTitle: formatRoutineTitle(routine?.shortTitle) || routine?.title
  });
  const effectiveClinicalGoals = isGoalsCustom ? clinicalGoals : generatedFocus;
  const resolvedCountryCodeForUi = resolveCountryCodeFromInput(countryName || countryCode);
  const regionalAvailabilityPresets = getRegionalAvailabilityPresets({
    countryCode: resolvedCountryCodeForUi,
    isRamadanFastingObserver: isRamadanObserver,
    culturalRhythms,
    basePresets: t.availabilityPresets,
    fastingPreset: t.fastingAvailabilityPreset,
    dawnPreset: t.dawnAvailabilityPreset,
    lateDinnerPreset: t.lateDinnerAvailabilityPreset
  });
  const availabilitySummaryPreview = formatAvailabilitySummary(
    { availabilityMode, availableWindows },
    undefined,
    locale
  );

  const toggleCulturalRhythm = (item: CulturalRhythmId) => {
    setCulturalRhythms((prev) =>
      prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item]
    );
  };

  const toggleCaution = (item: string) => {
    setCautions((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    );
  };

  const handleSelectRegion = (preset: (typeof REGION_PRESETS)[number]) => {
    setCountryCode(preset.countryCode);
    setCountryName(preset.countryName);
    setCity(preset.defaultCity);
  };

  const handlePrimaryLanguageChange = (nextPrimary: AppLocale) => {
    if (nextPrimary === primaryLanguage) return;
    if (secondaryLanguage === nextPrimary) {
      setSecondaryLanguage(primaryLanguage);
    }
    setPrimaryLanguage(nextPrimary);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedSecondary: SecondaryLanguage =
      secondaryLanguage === primaryLanguage ? 'none' : secondaryLanguage;

    const normalizedWindows = normalizeAvailableWindows(availableWindows);
    updateUserProfile({
      displayName: displayName.trim() || undefined,
      age: sanitizeAge(ageInput),
      biologicalSex,
      availabilityMode,
      availableWindows:
        availabilityMode === 'anytime'
          ? normalizedWindows
          : normalizedWindows.length > 0
            ? normalizedWindows
            : [...DEFAULT_AVAILABLE_WINDOWS],
      clinicalGoals: effectiveClinicalGoals.trim() || undefined,
      primaryLanguage,
      secondaryLanguage: normalizedSecondary,
      reminderNotificationsEnabled,
      communityCohortOptIn
    });
    setLocale(primaryLanguage);

    const nextTags = syncLifestyleActiveTags({
      ...lifestyleProfile,
      workPattern,
      activityBaseline,
      smokingStatus,
      climateSensitivity,
      culturalRhythms,
      isRamadanFastingObserver: isRamadanObserver
    });

    const resolvedCountry = countryName.trim() || 'United Arab Emirates';
    const resolvedCode = resolveCountryCodeFromInput(resolvedCountry);

    updateLifestyleProfile({
      region: {
        countryCode: resolvedCode,
        countryName: resolvedCountry,
        city: city.trim() || undefined,
        detectedBy: 'user_selected',
        confirmed: true
      },
      workPattern,
      activityBaseline,
      smokingStatus,
      climateSensitivity,
      culturalRhythms,
      isRamadanFastingObserver: isRamadanObserver,
      physicalCautions: cautions,
      activeTags: nextTags,
      intakeCompleted: true
    });

    toast.success(t.savedToast);
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email || isGuest) return;
    setIsSendingReset(true);
    try {
      await sendPasswordReset();
      toast.success(t.passwordResetSentToast(user.email));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.passwordResetUnavailableToast);
    } finally {
      setIsSendingReset(false);
    }
  };

  const memberSinceDate = user?.createdAt
    ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE' : 'en-US', {
        month: 'short',
        year: 'numeric'
      }).format(new Date(user.createdAt))
    : null;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink border-t-transparent" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader
          eyebrow={t.eyebrow}
          title={t.title}
          hideRoutineSwitcher
          switcherExtra={
            <div className="flex flex-wrap items-center gap-2.5">
              <SegmentedTabs
                variant="pills"
                options={[
                  { id: 'account' as const, label: t.tabs.account },
                  { id: 'lifestyle' as const, label: t.tabs.lifestyle }
                ]}
                value={activeTab}
                onChange={handleTabChange}
                ariaLabel={t.tabs.ariaLabel}
              />
              <Link
                href={ROUTES.routine}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink/20 bg-cream/70 px-3.5 text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-mint"
              >
                <span>{t.backToRoutine}</span>
                <Icon icon={NorthEastIcon} size="xs" />
              </Link>
            </div>
          }
        >
          <p className="mt-2 max-w-2xl text-sm text-ink/70">{t.subtitle}</p>
        </PageHeader>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-main-aside lg:gap-10">
          {/* Main Column: Account Management OR Adaptive Lifestyle Management */}
          <div className="space-y-6">
            <form onSubmit={handleSave} className="space-y-6">
            {/* Tab 1: Account & Physiological Baseline */}
            {activeTab === 'account' && (
            <Panel tone="white" className="space-y-5">
              <SectionHeading eyebrow={t.userProfileEyebrow} title={t.userProfileTitle} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-display-name" className="mb-1.5 block text-xs font-semibold text-ink/80">
                    {t.displayNameLabel}
                  </label>
                  <input
                    id="profile-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t.displayNamePlaceholder}
                    className="w-full rounded-xl border border-ink/15 bg-canvas/60 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink"
                  />
                </div>

                <div>
                  <label htmlFor="profile-age" className="mb-1.5 block text-xs font-semibold text-ink/80">
                    {t.ageLabel}
                  </label>
                  <input
                    id="profile-age"
                    type="number"
                    min={13}
                    max={110}
                    value={ageInput}
                    onChange={(e) => setAgeInput(e.target.value)}
                    placeholder={t.agePlaceholder}
                    className="w-full rounded-xl border border-ink/15 bg-canvas/60 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink"
                  />
                  <p className="mt-1 text-2xs text-ink/60">{t.ageHint}</p>
                </div>
              </div>

              <OptionChipGroup
                label={t.sexLabel}
                options={SEX_KEYS}
                value={biologicalSex}
                labels={t.sexOptions}
                onChange={setBiologicalSex}
              />

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-ink/80">{t.availabilityLabel}</p>
                  <div className="inline-flex rounded-full border border-ink/15 bg-canvas p-0.5">
                    {(['windows', 'anytime'] as const).map((modeOption) => (
                      <button
                        key={modeOption}
                        type="button"
                        onClick={() => setAvailabilityMode(modeOption)}
                        className={cn(
                          'rounded-full px-3 py-1 text-2xs font-medium transition-colors cursor-pointer',
                          availabilityMode === modeOption
                            ? 'bg-ink text-white'
                            : 'text-ink/70 hover:text-ink'
                        )}
                      >
                        {t.availabilityModes[modeOption]}
                      </button>
                    ))}
                  </div>
                </div>

                {availabilityMode === 'anytime' ? (
                  <p className="rounded-xl border border-ink/10 bg-canvas/60 p-3 text-xs leading-relaxed text-ink/75">
                    {t.availabilityAnytimeDesc}
                  </p>
                ) : (
                  <AvailableWindowsEditor
                    windows={availableWindows}
                    onChange={setAvailableWindows}
                    presets={regionalAvailabilityPresets}
                    addLabel={t.addWindowBtn}
                    labelPlaceholder={t.windowLabelPlaceholder}
                    presetsHeading={t.windowPresetsHeading}
                    removeAria={t.removeWindowAria}
                  />
                )}
                <p className="text-2xs text-ink/60">{t.availabilityHint}</p>
              </div>

              <div>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="profile-goals" className="text-xs font-semibold text-ink/80">
                    {t.goalsLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGoalsCustom(false);
                      setClinicalGoals(generatedFocus);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-cream/70 px-2.5 py-0.5 text-2xs font-semibold text-ink hover:bg-cream cursor-pointer"
                  >
                    <Icon icon={AutoAwesomeOutlinedIcon} size="xs" />
                    <span>{t.goalsGenerateBtn}</span>
                  </button>
                </div>
                <input
                  id="profile-goals"
                  type="text"
                  value={effectiveClinicalGoals}
                  onChange={(e) => {
                    setIsGoalsCustom(true);
                    setClinicalGoals(e.target.value);
                  }}
                  placeholder={t.goalsPlaceholder}
                  className="w-full rounded-xl border border-ink/15 bg-canvas/60 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink"
                />
                <p className="mt-1 text-2xs text-ink/60">{t.goalsHint}</p>
              </div>

              {/* Language & Header Quick Switcher */}
              <div id="language" className="border-t border-ink/10 pt-4 space-y-3">
                <p className="text-xs font-semibold text-ink/80">{t.languageSectionLabel}</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-2xs font-semibold text-ink/70">{t.primaryLanguageLabel}</p>
                    <div className="flex flex-wrap gap-2">
                      {supportedLocales.map((loc) => {
                        const active = primaryLanguage === loc.code;
                        return (
                          <button
                            key={loc.code}
                            type="button"
                            onClick={() => handlePrimaryLanguageChange(loc.code)}
                            aria-pressed={active}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                              active
                                ? 'border-ink bg-ink text-white'
                                : 'border-ink/15 bg-canvas/70 text-ink hover:border-ink/40 hover:bg-cream/60'
                            )}
                          >
                            {active && <Icon icon={CheckIcon} size="xs" />}
                            <span>{loc.nativeLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-2xs font-semibold text-ink/70">{t.secondaryLanguageLabel}</p>
                    <div className="flex flex-wrap gap-2">
                      {supportedLocales
                        .filter((loc) => loc.code !== primaryLanguage)
                        .map((loc) => {
                          const active = secondaryLanguage === loc.code;
                          return (
                            <button
                              key={loc.code}
                              type="button"
                              onClick={() => setSecondaryLanguage(loc.code)}
                              aria-pressed={active}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                                active
                                  ? 'border-ink bg-ink text-white'
                                  : 'border-ink/15 bg-canvas/70 text-ink hover:border-ink/40 hover:bg-cream/60'
                              )}
                            >
                              {active && <Icon icon={CheckIcon} size="xs" />}
                              <span>{loc.nativeLabel}</span>
                            </button>
                          );
                        })}
                      <button
                        type="button"
                        onClick={() => setSecondaryLanguage('none')}
                        aria-pressed={secondaryLanguage === 'none'}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                          secondaryLanguage === 'none'
                            ? 'border-ink bg-ink text-white'
                            : 'border-ink/15 bg-canvas/70 text-ink hover:border-ink/40 hover:bg-cream/60'
                        )}
                      >
                        {secondaryLanguage === 'none' && <Icon icon={CheckIcon} size="xs" />}
                        <span>{t.secondaryLanguageNone}</span>
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-2xs text-ink/60">{t.languageHint}</p>
              </div>

              {/* Notifications & Privacy Preferences */}
              <div className="border-t border-ink/10 pt-4 space-y-3">
                <p className="text-xs font-semibold text-ink/80">{t.privacyPreferencesLabel}</p>
                <div className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-canvas/50 px-4">
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink">{t.reminderNotificationsLabel}</p>
                      <p className="mt-0.5 text-2xs text-ink/65">{t.reminderNotificationsDesc}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={reminderNotificationsEnabled}
                      aria-label={t.reminderNotificationsLabel}
                      onClick={() => setReminderNotificationsEnabled((prev) => !prev)}
                      className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors cursor-pointer',
                        reminderNotificationsEnabled
                          ? 'border-ink bg-ink'
                          : 'border-ink/25 bg-white'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 rounded-full transition-transform',
                          reminderNotificationsEnabled
                            ? 'translate-x-5 bg-white rtl:-translate-x-5'
                            : 'translate-x-1 bg-ink/50 rtl:-translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink">{t.communityCohortOptInLabel}</p>
                      <p className="mt-0.5 text-2xs text-ink/65">{t.communityCohortOptInDesc}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={communityCohortOptIn}
                      aria-label={t.communityCohortOptInLabel}
                      onClick={() => setCommunityCohortOptIn((prev) => !prev)}
                      className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors cursor-pointer',
                        communityCohortOptIn
                          ? 'border-ink bg-ink'
                          : 'border-ink/25 bg-white'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 rounded-full transition-transform',
                          communityCohortOptIn
                            ? 'translate-x-5 bg-white rtl:-translate-x-5'
                            : 'translate-x-1 bg-ink/50 rtl:-translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </Panel>
            )}

            {/* Tab 2: Adaptive Lifestyle Context */}
            {activeTab === 'lifestyle' && (
            <Panel tone="white" className="space-y-5">
              <SectionHeading
                eyebrow={t.lifestyleEyebrow}
                title={t.lifestyleTitle}
                action={
                  <button
                    type="button"
                    onClick={openLifestyleTuning}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-cream/70 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-cream cursor-pointer"
                  >
                    <Icon icon={AutoAwesomeOutlinedIcon} size="xs" />
                    <span>{t.tuneWithAi}</span>
                  </button>
                }
              />

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-ink/80">{t.regionLabel}</p>
                  {lifestyleProfile.region.confirmed && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-0.5 text-2xs font-semibold text-ink">
                      <Icon icon={CheckIcon} size="xs" />
                      <span>{t.regionConfirmed}</span>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {REGION_PRESETS.map((preset) => {
                    const active = countryCode === preset.countryCode && countryName === preset.countryName;
                    return (
                      <button
                        key={preset.countryName}
                        type="button"
                        onClick={() => handleSelectRegion(preset)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                          active
                            ? 'border-ink bg-ink text-white'
                            : 'border-ink/15 bg-canvas/70 text-ink hover:border-ink/40'
                        )}
                      >
                        <span className="font-mono text-2xs font-semibold opacity-70" aria-hidden="true">
                          {preset.countryCode}
                        </span>
                        <span>{preset.countryName}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <input
                    type="text"
                    value={countryName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCountryName(val);
                      setCountryCode(resolveCountryCodeFromInput(val));
                    }}
                    placeholder="Country (e.g. Japan, Brazil, UAE, Germany)"
                    aria-label="Country"
                    className="w-full rounded-xl border border-ink/15 bg-canvas/60 px-3.5 py-2 text-sm text-ink outline-none focus:border-ink"
                  />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t.cityPlaceholder}
                    aria-label={t.cityPlaceholder}
                    className="w-full rounded-xl border border-ink/15 bg-canvas/60 px-3.5 py-2 text-sm text-ink outline-none focus:border-ink"
                  />
                </div>
              </div>

              <OptionChipGroup
                label={t.workPatternLabel}
                options={WORK_KEYS}
                value={workPattern}
                labels={t.workPatterns}
                onChange={setWorkPattern}
              />

              <OptionChipGroup
                label={t.activityLabel}
                options={ACTIVITY_KEYS}
                value={activityBaseline}
                labels={t.activityLevels}
                onChange={setActivityBaseline}
              />

              <OptionChipGroup
                label={t.smokingLabel}
                options={SMOKING_KEYS}
                value={smokingStatus}
                labels={t.smokingOptions}
                onChange={setSmokingStatus}
              />

              <OptionChipGroup
                label={t.climateLabel}
                options={CLIMATE_KEYS}
                value={climateSensitivity}
                labels={t.climateOptions}
                onChange={setClimateSensitivity}
              />

              {/* Cultural & Household Rhythms (Country-Independent) */}
              <div className="rounded-2xl border border-ink/10 bg-cream/50 p-4 space-y-2.5">
                <div>
                  <p className="text-sm font-semibold text-ink">{t.culturalRhythmsLabel}</p>
                  <p className="mt-0.5 text-xs text-ink/65">{t.culturalRhythmsHint}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CULTURAL_RHYTHM_KEYS.map((rhythmKey) => {
                    const active = culturalRhythms.includes(rhythmKey);
                    return (
                      <button
                        key={rhythmKey}
                        type="button"
                        onClick={() => toggleCulturalRhythm(rhythmKey)}
                        aria-pressed={active}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                          active
                            ? 'border-ink bg-mint text-ink font-semibold'
                            : 'border-ink/15 bg-white/80 text-ink hover:border-ink/40'
                        )}
                      >
                        {active && <Icon icon={CheckIcon} size="xs" />}
                        <span>{t.culturalRhythmOptions[rhythmKey]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Physical Cautions */}
              <div>
                <p className="mb-2 text-xs font-semibold text-ink/80">{t.cautionsLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {t.cautionPresets.map((item) => {
                    const active = cautions.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleCaution(item)}
                        aria-pressed={active}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                          active
                            ? 'border-ink bg-blush text-ink font-semibold'
                            : 'border-ink/15 bg-canvas/70 text-ink hover:border-ink/40'
                        )}
                      >
                        {active && <Icon icon={CheckIcon} size="xs" />}
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Adaptation Tags Preview */}
              <div className="border-t border-ink/10 pt-4">
                <p className="mb-2 text-xs font-semibold text-ink/80">{t.activeTagsLabel}</p>
                {previewTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {previewTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-cream px-2.5 py-1 text-2xs font-mono text-ink"
                      >
                        <Icon icon={TuneIcon} size="xs" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink/55">{t.noTagsYet}</p>
                )}
              </div>
            </Panel>
            )}

            <div className="flex justify-end">
              <PillButton type="submit" variant="primary" size="lg">
                {activeTab === 'account' ? t.saveAccountButton : t.saveLifestyleButton}
              </PillButton>
            </div>
            </form>

            {/* Data Export, Clear All Data, Deactivate & Delete Account (Account Tab) */}
            {activeTab === 'account' && <AccountControlsPanel />}
          </div>

          {/* Right / Aside Column: Live Connections & Account */}
          <aside className="space-y-4">
            <Panel tone="cream" className="space-y-4">
              <SectionHeading eyebrow={t.impactEyebrow} title={t.impactTitle} />

              <ul className="space-y-3 text-xs text-ink/80">
                <li className="flex items-start gap-2.5 rounded-xl bg-white/80 p-3 border border-ink/10">
                  <Icon icon={MonitorHeartOutlinedIcon} size="sm" className="mt-0.5 shrink-0 text-ink" />
                  <div>
                    <p>{t.impactAgeItem(parsedAge ?? 38, Boolean(parsedAge))}</p>
                    <Link
                      href={ROUTES.dashboard}
                      className="mt-1 inline-flex items-center gap-1 text-2xs font-semibold text-ink underline underline-offset-2"
                    >
                      <span>{copy.routine.openDashboard}</span>
                      <Icon icon={NorthEastIcon} size="xs" />
                    </Link>
                  </div>
                </li>

                <li className="flex items-start gap-2.5 rounded-xl bg-white/80 p-3 border border-ink/10">
                  <Icon icon={CalendarTodayOutlinedIcon} size="sm" className="mt-0.5 shrink-0 text-ink" />
                  <p>{t.impactAvailabilityItem(availabilitySummaryPreview)}</p>
                </li>

                <li className="flex items-start gap-2.5 rounded-xl bg-white/80 p-3 border border-ink/10">
                  <Icon icon={PeopleAltOutlinedIcon} size="sm" className="mt-0.5 shrink-0 text-ink" />
                  <div>
                    <p>{t.impactCohortItem(previewCohort)}</p>
                    <Link
                      href={ROUTES.community}
                      className="mt-1 inline-flex items-center gap-1 text-2xs font-semibold text-ink underline underline-offset-2"
                    >
                      <span>{copy.nav.community}</span>
                      <Icon icon={NorthEastIcon} size="xs" />
                    </Link>
                  </div>
                </li>

                <li className="flex items-start gap-2.5 rounded-xl bg-white/80 p-3 border border-ink/10">
                  <Icon icon={TranslateOutlinedIcon} size="sm" className="mt-0.5 shrink-0 text-ink" />
                  <p>
                    {t.impactLanguageItem(
                      getLocaleMeta(primaryLanguage).nativeLabel,
                      secondaryLanguage !== 'none' && secondaryLanguage !== primaryLanguage
                        ? getLocaleMeta(secondaryLanguage).nativeLabel
                        : undefined
                    )}
                  </p>
                </li>
              </ul>
            </Panel>

            <Panel tone="mint" className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar initials={user?.initials || 'tn'} />
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-base font-bold text-ink">
                      {displayName.trim() || user?.name || t.accountCardTitle}
                    </h2>
                    {user?.email && !isGuest && (
                      <p className="truncate text-2xs text-ink/75">{user.email}</p>
                    )}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-white/85 px-2.5 py-0.5 text-2xs font-semibold text-ink">
                  {isGuest || !user?.email ? t.accountStatusGuest : t.accountStatusActive}
                </span>
              </div>

              <div className="space-y-1 border-t border-ink/10 pt-3 text-2xs text-ink/75">
                {memberSinceDate && (
                  <p>
                    {t.memberSinceLabel}: <span className="font-semibold text-ink">{memberSinceDate}</span>
                  </p>
                )}
                <p className="tabular-nums">{t.storedDataSummary(allRoutines.length, storedLogsCount)}</p>
              </div>

              {isGuest || !user?.email ? (
                <>
                  <p className="text-xs leading-relaxed text-ink/80">{t.guestNotice}</p>
                  <Link href={ROUTES.login} className={pillClassName('ink', 'sm')}>
                    {t.signInCta}
                  </Link>
                </>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-xs leading-relaxed text-ink/85">
                    {t.signedInNotice(user.email)}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSendPasswordReset}
                      disabled={isSendingReset}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-ink/20 bg-white/85 px-3 py-1.5 text-2xs font-semibold text-ink transition-colors hover:bg-white disabled:opacity-50 cursor-pointer"
                    >
                      <Icon icon={KeyOutlinedIcon} size="xs" />
                      <span>{isSendingReset ? t.workingLabel : t.passwordResetBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={logout}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-2xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
                    >
                      <Icon icon={LogoutIcon} size="xs" />
                      <span>{t.signOutBtn}</span>
                    </button>
                  </div>
                </div>
              )}
            </Panel>
          </aside>
        </div>
      </div>
    </PageContainer>
  );
}
