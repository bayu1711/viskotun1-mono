'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined';
import { toast } from 'sonner';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { AccountControlsPanel } from '../components/profile/AccountControlsPanel';
import { TouchpointChannelsPanel } from '../components/profile/TouchpointChannelsPanel';
import { AIIcon } from '../components/ui/AIIcon';
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
  getCautionDisplayLabel,
  getLifestyleTagDisplayLabel,
  getLifestyleTagIcon
} from '../utils/lifestyleTags';
import {
  CAUTION_PRESET_KEYS,
  CULTURAL_RHYTHM_KEYS,
  MANAGED_LIFESTYLE_TAGS,
  canonicalizeCaution,
  deriveClinicalFocus,
  deriveLifestyleCohort,
  getRegionalAvailabilityPresets,
  normalizePhysicalCautions,
  resolveCulturalRhythms,
  sanitizeAge,
  syncLifestyleActiveTags
} from '../utils/profile';
import {
  formatAvailabilitySummary,
  normalizeAvailableWindows,
  resolveProfileAvailability
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

/** Shared base for every selectable chip on this page: 36px, 44px on touch screens, visible focus. */
const CHOICE_CHIP_BASE =
  'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 coarse:min-h-11';

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
                CHOICE_CHIP_BASE,
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
  const [availabilityMode, setAvailabilityMode] = useState<AvailabilityMode>('anytime');
  const [availableWindows, setAvailableWindows] = useState<AvailableTimeWindow[]>([]);
  const [clinicalGoals, setClinicalGoals] = useState('');
  const [isGoalsCustom, setIsGoalsCustom] = useState(false);
  const [primaryLanguage, setPrimaryLanguage] = useState<AppLocale>('en');
  const [secondaryLanguage, setSecondaryLanguage] = useState<SecondaryLanguage>('ar');
  const [reminderNotificationsEnabled, setReminderNotificationsEnabled] = useState(true);
  const [communityCohortOptIn, setCommunityCohortOptIn] = useState(true);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [activeTab, setActiveTab] = useState<'account' | 'lifestyle' | 'data'>('account');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'lifestyle' || tabParam === 'account' || tabParam === 'data') {
        setActiveTab(tabParam);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  const handleTabChange = (next: 'account' | 'lifestyle' | 'data') => {
    setActiveTab(next);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', next);
      window.history.replaceState(null, '', url.toString());
    } catch {
      // Ignore history errors
    }
  };

  const [countryCode, setCountryCode] = useState('');
  const [countryName, setCountryName] = useState('');
  const [city, setCity] = useState('');
  const [workPattern, setWorkPattern] = useState<WorkPattern>('standard');
  const [activityBaseline, setActivityBaseline] = useState<ActivityBaseline>('moderate');
  const [smokingStatus, setSmokingStatus] = useState<SmokingStatus>('non_smoker');
  const [climateSensitivity, setClimateSensitivity] =
    useState<NonNullable<UserLifestyleProfile['climateSensitivity']>>('moderate');
  const [culturalRhythms, setCulturalRhythms] = useState<CulturalRhythmId[]>([]);
  const [cautions, setCautions] = useState<string[]>([]);
  const [customCautionInput, setCustomCautionInput] = useState('');
  const [activeTagsDraft, setActiveTagsDraft] = useState<string[]>([]);

  // Hydrate form state whenever stored profile loads/updates externally (e.g., via AI tuning or sync)
  useEffect(() => {
    setDisplayName(userProfile.displayName || (user && !user.isGuest ? user.name : '') || '');
    setAgeInput(userProfile.age !== undefined ? String(userProfile.age) : '');
    setBiologicalSex(userProfile.biologicalSex);
    const resolvedAvailability = resolveProfileAvailability(userProfile);
    setAvailabilityMode(resolvedAvailability.mode);
    setAvailableWindows(resolvedAvailability.windows);
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
    setCountryCode(lifestyleProfile.region.countryCode || '');
    setCountryName(lifestyleProfile.region.countryName || '');
    setCity(lifestyleProfile.region.city || '');
    setWorkPattern(lifestyleProfile.workPattern || 'standard');
    setActivityBaseline(lifestyleProfile.activityBaseline || 'moderate');
    setSmokingStatus(lifestyleProfile.smokingStatus || 'non_smoker');
    setClimateSensitivity(lifestyleProfile.climateSensitivity || 'moderate');
    setCulturalRhythms(resolveCulturalRhythms(lifestyleProfile));
    setCautions(normalizePhysicalCautions(lifestyleProfile.physicalCautions));
    setActiveTagsDraft(lifestyleProfile.activeTags || []);
  }, [lifestyleProfile]);

  // Unsaved-changes tracking: the stored profile and the form are reduced to the same shape
  // (mirroring the two hydration effects above) and compared as strings.
  const storedSnapshot = useMemo(() => {
    const availability = resolveProfileAvailability(userProfile);
    const pair = resolveLanguagePair(userProfile.primaryLanguage, userProfile.secondaryLanguage);
    return JSON.stringify([
      userProfile.displayName || (user && !user.isGuest ? user.name : '') || '',
      userProfile.age !== undefined ? String(userProfile.age) : '',
      userProfile.biologicalSex ?? null,
      availability.mode,
      availability.windows,
      userProfile.clinicalGoals || '',
      pair.primary,
      pair.secondary ?? 'none',
      userProfile.reminderNotificationsEnabled ?? true,
      userProfile.communityCohortOptIn ?? true,
      lifestyleProfile.region.countryName || '',
      lifestyleProfile.region.city || '',
      lifestyleProfile.workPattern || 'standard',
      lifestyleProfile.activityBaseline || 'moderate',
      lifestyleProfile.smokingStatus || 'non_smoker',
      lifestyleProfile.climateSensitivity || 'moderate',
      resolveCulturalRhythms(lifestyleProfile).slice().sort(),
      normalizePhysicalCautions(lifestyleProfile.physicalCautions),
      lifestyleProfile.activeTags || []
    ]);
  }, [userProfile, lifestyleProfile, user]);
  const formSnapshot = JSON.stringify([
    displayName,
    ageInput,
    biologicalSex ?? null,
    availabilityMode,
    availableWindows,
    isGoalsCustom ? clinicalGoals : '',
    primaryLanguage,
    secondaryLanguage,
    reminderNotificationsEnabled,
    communityCohortOptIn,
    countryName,
    city,
    workPattern,
    activityBaseline,
    smokingStatus,
    climateSensitivity,
    culturalRhythms.slice().sort(),
    cautions,
    activeTagsDraft
  ]);
  const isDirty = formSnapshot !== storedSnapshot;

  // Ask before a reload or tab close throws away unsaved edits.
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const isRamadanObserver = culturalRhythms.includes('ramadan_fasting');
  const draftLifestyle: Partial<UserLifestyleProfile> = {
    ...lifestyleProfile,
    activeTags: activeTagsDraft,
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
  // Localized names for the cohort id and the region presets (the stored values stay English).
  const cohortLabels: Record<typeof previewCohort, string> = {
    smoker: copy.lifestyleTuning.filterSmokers,
    ramadan: copy.lifestyleTuning.filterRamadan,
    shift_work: copy.lifestyleTuning.filterShiftWork,
    general: copy.lifestyleTuning.filterAll
  };
  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: 'region' });
    } catch {
      return null;
    }
  }, [locale]);
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

  const visibleSmokingKeys: SmokingStatus[] = useMemo(() => {
    const isUae = resolvedCountryCodeForUi === 'AE';
    const isGccOrArab = ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'EG', 'JO', 'LB', 'IQ', 'SY'].includes(
      resolvedCountryCodeForUi
    );

    if (isUae) {
      return SMOKING_KEYS;
    }

    if (isGccOrArab) {
      return [
        'non_smoker',
        'shisha_waterpipe',
        'cigarettes',
        'vape',
        'former_smoker',
        ...(smokingStatus === 'midwakh_dokha' ? (['midwakh_dokha'] as const) : []),
        'other'
      ];
    }

    return [
      'non_smoker',
      'former_smoker',
      'cigarettes',
      'vape',
      ...(smokingStatus === 'midwakh_dokha' ? (['midwakh_dokha'] as const) : []),
      ...(smokingStatus === 'shisha_waterpipe' ? (['shisha_waterpipe'] as const) : []),
      'other'
    ];
  }, [resolvedCountryCodeForUi, smokingStatus]);

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

  const addCustomCaution = () => {
    const label = canonicalizeCaution(customCautionInput);
    if (!label) return;
    setCautions((prev) => normalizePhysicalCautions([...prev, label]));
    setCustomCautionInput('');
  };

  const removeCustomTag = (tag: string) => {
    setActiveTagsDraft((prev) => prev.filter((t) => t !== tag));
  };

  // Presets first, then any caution the AI or the user added in their own words.
  const cautionOptions = [
    ...CAUTION_PRESET_KEYS,
    ...cautions.filter((c) => !(CAUTION_PRESET_KEYS as readonly string[]).includes(c))
  ];

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
    const effectiveAvailabilityMode: AvailabilityMode =
      availabilityMode === 'windows' && normalizedWindows.length === 0
        ? 'anytime'
        : availabilityMode;
    updateUserProfile({
      displayName: displayName.trim() || undefined,
      age: sanitizeAge(ageInput),
      biologicalSex,
      availabilityMode: effectiveAvailabilityMode,
      availableWindows: normalizedWindows,
      clinicalGoals: effectiveClinicalGoals.trim() || undefined,
      primaryLanguage,
      secondaryLanguage: normalizedSecondary,
      reminderNotificationsEnabled,
      communityCohortOptIn
    });
    setLocale(primaryLanguage);

    const nextTags = syncLifestyleActiveTags(draftLifestyle);

    const trimmedCountry = countryName.trim();
    const resolvedRegion = trimmedCountry
      ? {
          countryCode: resolveCountryCodeFromInput(trimmedCountry),
          countryName: trimmedCountry,
          city: city.trim() || undefined,
          detectedBy: 'user_selected' as const,
          confirmed: true
        }
      : lifestyleProfile.region;

    updateLifestyleProfile({
      region: resolvedRegion,
      workPattern,
      activityBaseline,
      smokingStatus,
      climateSensitivity,
      culturalRhythms,
      isRamadanFastingObserver: isRamadanObserver,
      physicalCautions: normalizePhysicalCautions(cautions),
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
                  { id: 'lifestyle' as const, label: t.tabs.lifestyle },
                  { id: 'data' as const, label: t.tabs.data }
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
                <Icon icon={NorthEastIcon} size="xs" className="rtl:-scale-x-100" />
              </Link>
            </div>
          }
        >
          <p className="mt-2 max-w-2xl text-sm text-ink/70">{t.subtitle}</p>
        </PageHeader>

        {/* Two columns only from xl: at lg the 380px aside left the form ~270px wide. */}
        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-main-aside xl:gap-10">
          {/* Main Column: Account, Adaptive Lifestyle, OR Data & Account Controls */}
          <div className="space-y-6">
            {activeTab !== 'data' && (
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
                        aria-pressed={availabilityMode === modeOption}
                        className={cn(
                          'min-h-8 rounded-full px-3 py-1 text-2xs font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 coarse:min-h-10',
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
                              CHOICE_CHIP_BASE,
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
                                CHOICE_CHIP_BASE,
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
                          CHOICE_CHIP_BASE,
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

              <TouchpointChannelsPanel />
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
                    className="inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-ink/20 bg-cream/70 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-cream cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 coarse:min-h-11"
                  >
                    <AIIcon size="xs" />
                    <span>{t.tuneWithAi}</span>
                  </button>
                }
              />
              <p className="-mt-2 text-xs leading-relaxed text-ink/70">{t.lifestyleSyncNote}</p>

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
                          CHOICE_CHIP_BASE,
                          active
                            ? 'border-ink bg-ink text-white'
                            : 'border-ink/15 bg-canvas/70 text-ink hover:border-ink/40'
                        )}
                      >
                        <span className="font-mono text-2xs font-semibold opacity-70" aria-hidden="true">
                          {preset.countryCode}
                        </span>
                        <span>{regionNames?.of(preset.countryCode) ?? preset.countryName}</span>
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
                    placeholder={t.countryPlaceholder}
                    aria-label={t.countryAria}
                    autoComplete="country-name"
                    className="w-full rounded-xl border border-ink/15 bg-canvas/60 px-3.5 py-2 text-sm text-ink outline-none focus:border-ink coarse:min-h-11"
                  />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t.cityPlaceholder}
                    aria-label={t.cityPlaceholder}
                    className="w-full rounded-xl border border-ink/15 bg-canvas/60 px-3.5 py-2 text-sm text-ink outline-none focus:border-ink coarse:min-h-11"
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
                options={visibleSmokingKeys}
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
                          CHOICE_CHIP_BASE,
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

              {/* Physical Cautions — same canonical list the AI writes to */}
              <div>
                <p className="text-xs font-semibold text-ink/80">{t.cautionsLabel}</p>
                <p className="mb-2 mt-0.5 text-2xs text-ink/60">{t.cautionsHint}</p>
                <div className="flex flex-wrap gap-2">
                  {cautionOptions.map((item) => {
                    const active = cautions.includes(item);
                    const label = getCautionDisplayLabel(item, copy);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleCaution(item)}
                        aria-pressed={active}
                        className={cn(
                          CHOICE_CHIP_BASE,
                          active
                            ? 'border-ink bg-blush text-ink font-semibold'
                            : 'border-ink/15 bg-canvas/70 text-ink hover:border-ink/40'
                        )}
                      >
                        {active && <Icon icon={CheckIcon} size="xs" />}
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5 flex gap-2">
                  <input
                    type="text"
                    value={customCautionInput}
                    onChange={(e) => setCustomCautionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomCaution();
                      }
                    }}
                    maxLength={60}
                    placeholder={t.customCautionPlaceholder}
                    aria-label={t.customCautionAria}
                    className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-canvas/60 px-3.5 py-2 text-base text-ink outline-none focus:border-ink sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={addCustomCaution}
                    disabled={!customCautionInput.trim()}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-ink/20 bg-cream/70 px-3.5 text-xs font-semibold text-ink transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    <Icon icon={AddIcon} size="xs" />
                    <span>{t.addCautionBtn}</span>
                  </button>
                </div>
              </div>

              {/* Active Adaptation Tags Preview — same labels & icons as the N1 AI chat */}
              <div className="border-t border-ink/10 pt-4">
                <p className="text-xs font-semibold text-ink/80">{t.activeTagsLabel}</p>
                <p className="mb-2 mt-0.5 text-2xs text-ink/60">{t.activeTagsHint}</p>
                {previewTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {previewTags.map((tag) => {
                      const label = getLifestyleTagDisplayLabel(tag, copy);
                      const isCustom = !MANAGED_LIFESTYLE_TAGS.has(tag);
                      return (
                        <span
                          key={tag}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border border-mint bg-mint/35 py-1 text-2xs font-medium text-ink',
                            isCustom ? 'ps-2.5 pe-1' : 'px-2.5'
                          )}
                        >
                          <Icon icon={getLifestyleTagIcon(tag)} size="xs" className="text-ink/75" />
                          <span>{label}</span>
                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => removeCustomTag(tag)}
                              aria-label={t.removeTagAria(label)}
                              className="rounded-full p-0.5 text-ink/70 transition-colors hover:bg-ink/10 hover:text-ink cursor-pointer"
                            >
                              <Icon icon={CloseIcon} size="xs" />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-ink/70">{t.noTagsYet}</p>
                )}
              </div>
            </Panel>
            )}

            {/* Sticky save bar: the form runs several screens on a phone, so Save and the
                unsaved-changes state stay in reach instead of living only at the bottom. */}
            <div className="sticky bottom-24 z-10 flex items-center justify-between gap-3 rounded-full border border-ink/15 bg-white py-1.5 pe-1.5 ps-4 lg:bottom-6">
              <p aria-live="polite" className="flex min-w-0 items-center gap-2 text-xs font-medium text-ink/80">
                {isDirty ? (
                  <>
                    <span className="h-2 w-2 shrink-0 rounded-full bg-orange" aria-hidden="true" />
                    <span className="truncate">{t.unsavedChanges}</span>
                  </>
                ) : (
                  <>
                    <Icon icon={CheckIcon} size="xs" className="shrink-0 text-success" />
                    <span className="truncate">{t.allChangesSaved}</span>
                  </>
                )}
              </p>
              <PillButton type="submit" variant="primary" size="sm" className="shrink-0 coarse:min-h-11">
                {activeTab === 'account' ? t.saveAccountButton : t.saveLifestyleButton}
              </PillButton>
            </div>
            </form>
            )}

            {/* Tab 3: Data & Account Controls */}
            {activeTab === 'data' && <AccountControlsPanel />}
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
                      <Icon icon={NorthEastIcon} size="xs" className="rtl:-scale-x-100" />
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
                    <p>{t.impactCohortItem(cohortLabels[previewCohort])}</p>
                    <Link
                      href={ROUTES.community}
                      className="mt-1 inline-flex items-center gap-1 text-2xs font-semibold text-ink underline underline-offset-2"
                    >
                      <span>{copy.nav.community}</span>
                      <Icon icon={NorthEastIcon} size="xs" className="rtl:-scale-x-100" />
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
                      className="inline-flex min-h-9 coarse:min-h-11 items-center gap-1.5 rounded-full border border-ink/20 bg-white/85 px-3 py-1.5 text-2xs font-semibold text-ink transition-colors hover:bg-white disabled:opacity-50 cursor-pointer"
                    >
                      <Icon icon={KeyOutlinedIcon} size="xs" />
                      <span>{isSendingReset ? t.workingLabel : t.passwordResetBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={logout}
                      className="inline-flex min-h-9 coarse:min-h-11 items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-2xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
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
