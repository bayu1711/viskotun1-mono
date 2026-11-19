'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CheckIcon from '@mui/icons-material/Check';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import { toast } from 'sonner';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Icon } from '../components/ui/Icon';
import { Panel } from '../components/ui/Panel';
import { PillButton, pillClassName } from '../components/ui/PillButton';
import { SectionHeading } from '../components/ui/SectionHeading';
import { useAssistant } from '../contexts/AssistantContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { ROUTES } from '../data/navigation';
import type {
  ActivityBaseline,
  BiologicalSex,
  SmokingStatus,
  UserLifestyleProfile,
  WorkPattern
} from '../types/auth';
import { cn } from '../utils/cn';
import {
  deriveLifestyleCohort,
  sanitizeAge,
  syncLifestyleActiveTags
} from '../utils/profile';

const REGION_PRESETS = [
  { countryCode: 'AE', countryName: 'United Arab Emirates', defaultCity: 'Abu Dhabi', flag: '🇦🇪' },
  { countryCode: 'SA', countryName: 'Saudi Arabia', defaultCity: 'Riyadh', flag: '🇸🇦' },
  { countryCode: 'GB', countryName: 'United Kingdom', defaultCity: 'London', flag: '🇬🇧' },
  { countryCode: 'US', countryName: 'United States', defaultCity: 'New York', flag: '🇺🇸' }
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
    updateLifestyleProfile
  } = useAuth();
  const { openLifestyleTuning } = useAssistant();
  const { copy, isRtl } = useLocale();
  const t = copy.profile;

  const [displayName, setDisplayName] = useState('');
  const [ageInput, setAgeInput] = useState('');
  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex | undefined>(undefined);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [clinicalGoals, setClinicalGoals] = useState('');

  const [countryCode, setCountryCode] = useState('AE');
  const [countryName, setCountryName] = useState('United Arab Emirates');
  const [city, setCity] = useState('Abu Dhabi');
  const [workPattern, setWorkPattern] = useState<WorkPattern>('standard');
  const [activityBaseline, setActivityBaseline] = useState<ActivityBaseline>('moderate');
  const [smokingStatus, setSmokingStatus] = useState<SmokingStatus>('non_smoker');
  const [climateSensitivity, setClimateSensitivity] =
    useState<NonNullable<UserLifestyleProfile['climateSensitivity']>>('moderate');
  const [isRamadanObserver, setIsRamadanObserver] = useState(false);
  const [cautions, setCautions] = useState<string[]>([]);

  // Hydrate form state whenever stored profile loads/updates externally (e.g., via AI tuning or sync)
  useEffect(() => {
    setDisplayName(userProfile.displayName || (user && !user.isGuest ? user.name : '') || '');
    setAgeInput(userProfile.age !== undefined ? String(userProfile.age) : '');
    setBiologicalSex(userProfile.biologicalSex);
    setReminderTime(userProfile.preferredReminderTime || '09:00');
    setClinicalGoals(userProfile.clinicalGoals || '');
  }, [userProfile, user]);

  useEffect(() => {
    setCountryCode(lifestyleProfile.region.countryCode || 'AE');
    setCountryName(lifestyleProfile.region.countryName || 'United Arab Emirates');
    setCity(lifestyleProfile.region.city || '');
    setWorkPattern(lifestyleProfile.workPattern || 'standard');
    setActivityBaseline(lifestyleProfile.activityBaseline || 'moderate');
    setSmokingStatus(lifestyleProfile.smokingStatus || 'non_smoker');
    setClimateSensitivity(lifestyleProfile.climateSensitivity || 'moderate');
    setIsRamadanObserver(Boolean(lifestyleProfile.isRamadanFastingObserver));
    setCautions(lifestyleProfile.physicalCautions || []);
  }, [lifestyleProfile]);

  const draftLifestyle: Partial<UserLifestyleProfile> = {
    ...lifestyleProfile,
    workPattern,
    activityBaseline,
    smokingStatus,
    climateSensitivity,
    isRamadanFastingObserver: isRamadanObserver,
    physicalCautions: cautions
  };
  const previewTags = syncLifestyleActiveTags(draftLifestyle);
  const previewCohort = deriveLifestyleCohort(draftLifestyle);
  const parsedAge = sanitizeAge(ageInput);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    updateUserProfile({
      displayName: displayName.trim() || undefined,
      age: sanitizeAge(ageInput),
      biologicalSex,
      preferredReminderTime: reminderTime || '09:00',
      clinicalGoals: clinicalGoals.trim() || undefined
    });

    const nextTags = syncLifestyleActiveTags({
      ...lifestyleProfile,
      workPattern,
      activityBaseline,
      smokingStatus,
      climateSensitivity,
      isRamadanFastingObserver: isRamadanObserver
    });

    updateLifestyleProfile({
      region: {
        countryCode,
        countryName,
        city: city.trim() || undefined,
        detectedBy: 'user_selected',
        confirmed: true
      },
      workPattern,
      activityBaseline,
      smokingStatus,
      climateSensitivity,
      isRamadanFastingObserver: isRamadanObserver,
      physicalCautions: cautions,
      activeTags: nextTags,
      intakeCompleted: true
    });

    toast.success(t.savedToast);
  };

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
          switcherExtra={
            <Link href={ROUTES.routine} className={pillClassName('outline', 'sm')}>
              <span>{t.backToRoutine}</span>
              <Icon icon={NorthEastIcon} size="xs" />
            </Link>
          }
        >
          <p className="mt-2 max-w-2xl text-sm text-ink/70">{t.subtitle}</p>
        </PageHeader>

        <form onSubmit={handleSave} className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-main-aside lg:gap-10">
          {/* Main Column: UserProfile + UserLifestyleProfile */}
          <div className="space-y-6">
            {/* Section 1: UserProfile */}
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

              <div>
                <label htmlFor="profile-reminder-time" className="mb-1.5 block text-xs font-semibold text-ink/80">
                  {t.reminderTimeLabel}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="profile-reminder-time"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="rounded-xl border border-ink/15 bg-canvas/60 px-3.5 py-2 text-sm text-ink outline-none focus:border-ink"
                  />
                  {t.reminderPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setReminderTime(preset.value)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                        reminderTime === preset.value
                          ? 'border-ink bg-mint text-ink font-semibold'
                          : 'border-ink/15 bg-canvas/60 text-ink/80 hover:border-ink/40'
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-2xs text-ink/60">{t.reminderTimeHint}</p>
              </div>

              <div>
                <label htmlFor="profile-goals" className="mb-1.5 block text-xs font-semibold text-ink/80">
                  {t.goalsLabel}
                </label>
                <input
                  id="profile-goals"
                  type="text"
                  value={clinicalGoals}
                  onChange={(e) => setClinicalGoals(e.target.value)}
                  placeholder={t.goalsPlaceholder}
                  className="w-full rounded-xl border border-ink/15 bg-canvas/60 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink"
                />
              </div>
            </Panel>

            {/* Section 2: UserLifestyleProfile */}
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
                    <span className="rounded-full bg-mint px-2.5 py-0.5 text-2xs font-semibold text-ink">
                      ✓ {t.regionConfirmed}
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
                        <span aria-hidden="true">{preset.flag}</span>
                        <span>{preset.countryName}</span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t.cityPlaceholder}
                  aria-label={t.cityPlaceholder}
                  className="w-full rounded-xl border border-ink/15 bg-canvas/60 px-3.5 py-2 text-sm text-ink outline-none focus:border-ink sm:max-w-xs"
                />
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

              {/* Ramadan Toggle */}
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-cream/50 p-4">
                <div>
                  <p className="text-sm font-semibold text-ink">{t.ramadanLabel}</p>
                  <p className="mt-0.5 text-xs text-ink/65">{t.ramadanDesc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isRamadanObserver}
                  onClick={() => setIsRamadanObserver((prev) => !prev)}
                  className={cn(
                    'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-ink/20 transition-colors cursor-pointer',
                    isRamadanObserver ? 'bg-mint' : 'bg-white'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-ink transition-transform',
                      isRamadanObserver
                        ? isRtl ? '-translate-x-1' : 'translate-x-6'
                        : isRtl ? '-translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
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

            <div className="flex justify-end">
              <PillButton type="submit" variant="primary" size="lg">
                {t.saveButton}
              </PillButton>
            </div>
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
                  <p>{t.impactReminderItem(reminderTime || '09:00')}</p>
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
              </ul>
            </Panel>

            <Panel tone="mint" className="space-y-3">
              <h2 className="font-display text-base font-bold text-ink">{t.accountCardTitle}</h2>
              {isGuest || !user?.email ? (
                <>
                  <p className="text-xs leading-relaxed text-ink/80">{t.guestNotice}</p>
                  <Link href={ROUTES.login} className={pillClassName('ink', 'sm')}>
                    {t.signInCta}
                  </Link>
                </>
              ) : (
                <p className="text-xs leading-relaxed text-ink/85">
                  {t.signedInNotice(user.email)}
                </p>
              )}
            </Panel>
          </aside>
        </form>
      </div>
    </PageContainer>
  );
}
