'use client';

import React, { useEffect, useState } from 'react';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import { toast } from 'sonner';
import { useLocale } from '../../contexts/LocaleContext';
import type { ChatMessage } from '../../types/routine';
import type {
  RegionalLifestyleTag,
  SmokingStatus,
  UserLifestyleProfile,
  UserProfile,
  WorkPattern
} from '../../types/auth';
import { formatLifestyleTagLabel, getLifestyleTagIcon } from '../../utils/lifestyleTags';
import {
  deriveClinicalFocus,
  getRegionalReminderPresets,
  sanitizeAge,
  syncLifestyleActiveTags
} from '../../utils/profile';
import { AssistantMessage } from './AssistantMessage';
import { TypingIndicator } from './TypingIndicator';
import { Icon } from '../ui/Icon';

const PRESET_REGIONS = [
  { countryCode: 'AE', countryName: 'United Arab Emirates', city: 'Abu Dhabi' },
  { countryCode: 'AE', countryName: 'United Arab Emirates', city: 'Dubai' },
  { countryCode: 'SA', countryName: 'Saudi Arabia', city: 'Riyadh' },
  { countryCode: 'GB', countryName: 'United Kingdom', city: 'London' },
  { countryCode: 'US', countryName: 'United States', city: 'New York' }
];

const WORK_KEYS: WorkPattern[] = ['standard', 'shift_work', 'desk_sedentary'];
const CLIMATE_KEYS: Array<NonNullable<UserLifestyleProfile['climateSensitivity']>> = [
  'summer_heat',
  'moderate',
  'cold_climate'
];
const SMOKING_KEYS: SmokingStatus[] = [
  'non_smoker',
  'midwakh_dokha',
  'shisha_waterpipe',
  'cigarettes',
  'vape'
];

interface LifestyleTuningViewProps {
  lifestyleProfile?: UserLifestyleProfile;
  userProfile?: UserProfile;
  activeRoutineTitle?: string;
  messages: ChatMessage[];
  isTyping: boolean;
  onTune: (message: string) => Promise<unknown>;
  onConfirmRegion?: (countryName: string, city?: string) => void;
  onUpdateProfile?: (updates: Partial<UserLifestyleProfile>) => void;
  onUpdateUserProfile?: (updates: Partial<UserProfile>) => void;
  onCompleteOnboarding?: () => void;
  onSkipOnboarding?: () => void;
}

export function LifestyleTuningView({
  lifestyleProfile,
  userProfile,
  activeRoutineTitle,
  messages,
  isTyping,
  onTune,
  onConfirmRegion,
  onUpdateProfile,
  onUpdateUserProfile,
  onCompleteOnboarding,
  onSkipOnboarding
}: LifestyleTuningViewProps) {
  const { copy } = useLocale();
  const [isChangingRegion, setIsChangingRegion] = useState(false);
  const [customCity, setCustomCity] = useState('');
  const [suggestions, setSuggestions] = useState<RegionalLifestyleTag[]>([]);

  // Guided Q&A onboarding wizard state (steps 1..4)
  const [rerunGuided, setRerunGuided] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [ageDraft, setAgeDraft] = useState(() =>
    userProfile?.age !== undefined ? String(userProfile.age) : ''
  );
  const [reminderDraft, setReminderDraft] = useState(
    () => userProfile?.preferredReminderTime || '09:00'
  );
  const [workDraft, setWorkDraft] = useState<WorkPattern>(
    () => lifestyleProfile?.workPattern || 'standard'
  );
  const [climateDraft, setClimateDraft] = useState<
    NonNullable<UserLifestyleProfile['climateSensitivity']>
  >(() => lifestyleProfile?.climateSensitivity || 'moderate');
  const [ramadanDraft, setRamadanDraft] = useState<boolean>(
    () => Boolean(lifestyleProfile?.isRamadanFastingObserver)
  );
  const [smokingDraft, setSmokingDraft] = useState<SmokingStatus>(
    () => lifestyleProfile?.smokingStatus || 'non_smoker'
  );
  const [cautionsDraft, setCautionsDraft] = useState<string[]>(
    () => lifestyleProfile?.physicalCautions || []
  );

  const region = lifestyleProfile?.region;
  const countryCode = region?.countryCode || 'AE';
  const countryName = region?.countryName || 'United Arab Emirates';
  const city = region?.city || '';
  const regionLabel = city ? `${city}, ${countryName}` : countryName;
  const isConfirmed = region?.confirmed ?? false;
  const activeTags = lifestyleProfile?.activeTags || [];
  const showGuidedInterview = !lifestyleProfile?.intakeCompleted || rerunGuided;

  // Keep local wizard drafts synced if store hydrates after initial mount
  useEffect(() => {
    if (userProfile?.age !== undefined) setAgeDraft(String(userProfile.age));
    if (userProfile?.preferredReminderTime) setReminderDraft(userProfile.preferredReminderTime);
  }, [userProfile?.age, userProfile?.preferredReminderTime]);

  useEffect(() => {
    if (lifestyleProfile?.workPattern) setWorkDraft(lifestyleProfile.workPattern);
    if (lifestyleProfile?.climateSensitivity) setClimateDraft(lifestyleProfile.climateSensitivity);
    if (lifestyleProfile?.isRamadanFastingObserver !== undefined) {
      setRamadanDraft(Boolean(lifestyleProfile.isRamadanFastingObserver));
    }
    if (lifestyleProfile?.smokingStatus) setSmokingDraft(lifestyleProfile.smokingStatus);
    if (lifestyleProfile?.physicalCautions) setCautionsDraft(lifestyleProfile.physicalCautions);
  }, [lifestyleProfile]);

  useEffect(() => {
    let active = true;
    async function loadSuggestions() {
      try {
        const params = new URLSearchParams({ country: countryCode });
        if (countryName) params.set('countryName', countryName);
        if (city) params.set('city', city);
        const res = await fetch(`/api/lifestyle/tune?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
          }
        }
      } catch {
        // Fall back gracefully
      }
    }
    loadSuggestions();
    return () => {
      active = false;
    };
  }, [countryCode, countryName, city]);

  const handleConfirmLocation = () => {
    if (onConfirmRegion) {
      onConfirmRegion(countryName, city || undefined);
    }
    setIsChangingRegion(false);
    if (showGuidedInterview && step === 1) {
      setStep(2);
    }
  };

  const handleSelectPresetRegion = (preset: (typeof PRESET_REGIONS)[0]) => {
    if (onConfirmRegion) {
      onConfirmRegion(preset.countryName, preset.city);
    }
    setIsChangingRegion(false);
    if (showGuidedInterview && step === 1) {
      setStep(2);
    }
  };

  const handleCustomRegionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = customCity.trim();
    if (!raw || !onConfirmRegion) return;
    if (raw.includes(',')) {
      const [cityPart, ...countryParts] = raw.split(',');
      const parsedCity = cityPart.trim();
      const parsedCountry = countryParts.join(',').trim();
      onConfirmRegion(parsedCountry || parsedCity, parsedCity || undefined);
    } else if (/^(?:[A-Za-z]{2}|usa|uk|uae)$/i.test(raw)) {
      onConfirmRegion(raw, undefined);
    } else {
      onConfirmRegion(raw, raw);
    }
    setCustomCity('');
    setIsChangingRegion(false);
    if (showGuidedInterview && step === 1) {
      setStep(2);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!onUpdateProfile) return;
    const nextTags = activeTags.filter((t) => t !== tagToRemove);
    onUpdateProfile({ activeTags: nextTags });
  };

  const handleChipClick = (tagLabel: string) => {
    const matchingExisting = activeTags.find((t) => formatLifestyleTagLabel(t) === tagLabel);
    if (matchingExisting) {
      handleRemoveTag(matchingExisting);
    } else {
      onTune(tagLabel);
    }
  };

  const toggleDraftCaution = (item: string) => {
    setCautionsDraft((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    );
  };

  const previewFocus = deriveClinicalFocus(
    {
      ...lifestyleProfile,
      workPattern: workDraft,
      climateSensitivity: climateDraft,
      isRamadanFastingObserver: ramadanDraft,
      smokingStatus: smokingDraft,
      physicalCautions: cautionsDraft
    },
    { age: sanitizeAge(ageDraft), routineTitle: activeRoutineTitle }
  );

  const handleFinishGuidedOnboarding = () => {
    const validAge = sanitizeAge(ageDraft);
    const nextTags = syncLifestyleActiveTags({
      ...lifestyleProfile,
      workPattern: workDraft,
      climateSensitivity: climateDraft,
      isRamadanFastingObserver: ramadanDraft,
      smokingStatus: smokingDraft,
      activeTags
    });

    onUpdateUserProfile?.({
      ...(validAge !== undefined ? { age: validAge } : {}),
      preferredReminderTime: reminderDraft || '09:00',
      clinicalGoals: previewFocus
    });

    onUpdateProfile?.({
      region: {
        countryCode,
        countryName,
        city: city || undefined,
        detectedBy: isConfirmed ? 'user_selected' : lifestyleProfile?.region?.detectedBy || 'client_timezone',
        confirmed: true
      },
      workPattern: workDraft,
      climateSensitivity: climateDraft,
      isRamadanFastingObserver: ramadanDraft,
      smokingStatus: smokingDraft,
      physicalCautions: cautionsDraft,
      activeTags: nextTags,
      intakeCompleted: true
    });

    setRerunGuided(false);
    toast.success(copy.lifestyleTuning.onboarding.completedToast);
    onCompleteOnboarding?.();
  };

  const t = copy.lifestyleTuning.onboarding;
  const pCopy = copy.profile;
  const reminderPresets = getRegionalReminderPresets({
    countryCode,
    isRamadanFastingObserver: ramadanDraft,
    basePresets: pCopy.reminderPresets,
    fastingPreset: pCopy.fastingReminderPreset
  });

  const renderRegionSelector = () => (
    <div className="mt-3 space-y-2 border-t border-ink/10 pt-3">
      <p className="text-2xs font-medium text-ink/70">Select preset or enter any global city:</p>
      <div className="flex flex-wrap gap-1.5">
        {PRESET_REGIONS.map((preset) => (
          <button
            key={`${preset.countryCode}-${preset.city}`}
            type="button"
            onClick={() => handleSelectPresetRegion(preset)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-medium transition-colors cursor-pointer ${
              preset.city === city
                ? 'border-ink bg-ink text-white'
                : 'border-ink/20 bg-canvas text-ink hover:border-ink'
            }`}
          >
            <span className="font-mono text-3xs font-semibold opacity-70">{preset.countryCode}</span>
            <span>{preset.city}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleCustomRegionSubmit} className="mt-2 flex gap-1.5">
        <input
          type="text"
          value={customCity}
          onChange={(e) => setCustomCity(e.target.value)}
          placeholder="Type any city, country (e.g. Tokyo, Japan · Berlin, Germany)..."
          className="flex-1 rounded-full border border-ink/20 bg-canvas px-3 py-1 text-2xs text-ink placeholder:text-ink/50 focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={!customCity.trim()}
          className="rounded-full bg-ink px-3 py-1 text-2xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
        >
          Set
        </button>
      </form>
    </div>
  );

  return (
    <div className="space-y-4">
      {showGuidedInterview ? (
        /* Interactive 4-Question TrialN1 Interview for New / Un-Onboarded Users */
        <div className="rounded-card border border-ink/20 bg-white p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-ink/10 pb-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/50 px-2.5 py-0.5 text-3xs font-bold text-ink">
              <Icon icon={AutoAwesomeOutlinedIcon} size="xs" />
              <span>{t.badge(step, 4)}</span>
            </span>
            {onSkipOnboarding && (
              <button
                type="button"
                onClick={onSkipOnboarding}
                className="text-2xs font-medium text-ink/60 hover:text-ink underline underline-offset-2 cursor-pointer"
              >
                {t.skipBtn}
              </button>
            )}
          </div>

          {/* Step Progress Bar */}
          <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-colors ${idx <= step ? 'bg-ink' : 'bg-ink/15'}`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-ink">{t.q1Title}</h3>
              <p className="text-xs leading-relaxed text-ink/75">{t.q1Ask(regionLabel)}</p>
              <div className="rounded-tile bg-cream/70 p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon icon={LocationOnOutlinedIcon} size="sm" className="text-ink/80" />
                  <span className="text-xs font-semibold text-ink">{regionLabel}</span>
                  <span className="rounded bg-ink/10 px-1.5 py-0.5 font-mono text-3xs font-semibold text-ink/70">
                    {countryCode}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmLocation}
                    className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-2xs font-semibold text-white hover:opacity-90 cursor-pointer"
                  >
                    <Icon icon={CheckIcon} size="xs" />
                    <span>{copy.lifestyleTuning.confirmLocationBtn(city || countryName)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingRegion((p) => !p)}
                    className="rounded-full border border-ink/20 bg-white px-3 py-1.5 text-2xs font-medium text-ink hover:border-ink cursor-pointer"
                  >
                    {copy.lifestyleTuning.changeLocationBtn}
                  </button>
                </div>
              </div>
              {isChangingRegion && renderRegionSelector()}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-ink">{t.q2Title}</h3>
              <p className="text-xs leading-relaxed text-ink/75">{t.q2Ask}</p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="onboard-age" className="mb-1 block text-2xs font-semibold text-ink/80">
                    {pCopy.ageLabel}
                  </label>
                  <input
                    id="onboard-age"
                    type="number"
                    min={13}
                    max={110}
                    value={ageDraft}
                    onChange={(e) => setAgeDraft(e.target.value)}
                    placeholder={pCopy.agePlaceholder}
                    className="w-full rounded-xl border border-ink/20 bg-canvas px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="onboard-time" className="mb-1 block text-2xs font-semibold text-ink/80">
                    {pCopy.reminderTimeLabel}
                  </label>
                  <input
                    id="onboard-time"
                    type="time"
                    value={reminderDraft}
                    onChange={(e) => setReminderDraft(e.target.value)}
                    className="w-full rounded-xl border border-ink/20 bg-canvas px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {reminderPresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setReminderDraft(preset.value)}
                    className={`rounded-full border px-2.5 py-1 text-2xs font-medium cursor-pointer ${
                      reminderDraft === preset.value
                        ? 'border-ink bg-mint text-ink font-semibold'
                        : 'border-ink/15 bg-canvas text-ink/80 hover:border-ink/40'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-2xs font-medium text-ink/60 hover:text-ink cursor-pointer"
                >
                  ← {t.backBtn}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-full bg-ink px-4 py-1.5 text-2xs font-semibold text-white hover:opacity-90 cursor-pointer"
                >
                  {t.nextBtn} →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-ink">{t.q3Title}</h3>
              <p className="text-xs leading-relaxed text-ink/75">{t.q3Ask(regionLabel)}</p>

              <div className="space-y-2.5">
                <div>
                  <p className="mb-1.5 text-2xs font-semibold text-ink/75">{pCopy.workPatternLabel}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {WORK_KEYS.map((wk) => (
                      <button
                        key={wk}
                        type="button"
                        onClick={() => setWorkDraft(wk)}
                        className={`rounded-full border px-2.5 py-1 text-2xs font-medium cursor-pointer ${
                          workDraft === wk
                            ? 'border-ink bg-ink text-white'
                            : 'border-ink/15 bg-canvas text-ink hover:border-ink/40'
                        }`}
                      >
                        {pCopy.workPatterns[wk]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-2xs font-semibold text-ink/75">{pCopy.climateLabel}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CLIMATE_KEYS.map((ck) => (
                      <button
                        key={ck}
                        type="button"
                        onClick={() => setClimateDraft(ck)}
                        className={`rounded-full border px-2.5 py-1 text-2xs font-medium cursor-pointer ${
                          climateDraft === ck
                            ? 'border-ink bg-ink text-white'
                            : 'border-ink/15 bg-canvas text-ink hover:border-ink/40'
                        }`}
                      >
                        {pCopy.climateOptions[ck]}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setRamadanDraft((p) => !p)}
                  aria-pressed={ramadanDraft}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-2xs font-medium cursor-pointer ${
                    ramadanDraft
                      ? 'border-ink bg-mint text-ink font-semibold'
                      : 'border-ink/20 bg-canvas text-ink hover:border-ink/40'
                  }`}
                >
                  {ramadanDraft && <Icon icon={CheckIcon} size="xs" />}
                  <span>{pCopy.ramadanLabel}</span>
                </button>
              </div>

              {suggestions.length > 0 && (
                <div className="border-t border-ink/10 pt-2.5">
                  <p className="mb-1.5 text-2xs font-semibold text-ink/75">
                    {copy.lifestyleTuning.suggestionsEyebrow(city || countryName)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.slice(0, 5).map((suggestion) => {
                      const displayLabel = formatLifestyleTagLabel(suggestion.label);
                      const isSelected = activeTags.some((tag) => formatLifestyleTagLabel(tag) === displayLabel);
                      const TagIcon = getLifestyleTagIcon(displayLabel, suggestion.category);
                      return (
                        <button
                          key={suggestion.id}
                          type="button"
                          onClick={() => handleChipClick(displayLabel)}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-2xs font-medium cursor-pointer ${
                            isSelected
                              ? 'border-mint bg-mint text-ink font-semibold'
                              : 'border-ink/15 bg-canvas text-ink hover:border-ink'
                          }`}
                        >
                          <Icon icon={isSelected ? CheckIcon : TagIcon} size="xs" />
                          <span>{displayLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-2xs font-medium text-ink/60 hover:text-ink cursor-pointer"
                >
                  ← {t.backBtn}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="rounded-full bg-ink px-4 py-1.5 text-2xs font-semibold text-white hover:opacity-90 cursor-pointer"
                >
                  {t.nextBtn} →
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-ink">{t.q4Title}</h3>
              <p className="text-xs leading-relaxed text-ink/75">{t.q4Ask}</p>

              <div>
                <p className="mb-1.5 text-2xs font-semibold text-ink/75">{pCopy.cautionsLabel}</p>
                <div className="flex flex-wrap gap-1.5">
                  {pCopy.cautionPresets.map((item) => {
                    const active = cautionsDraft.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleDraftCaution(item)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-2xs font-medium cursor-pointer ${
                          active
                            ? 'border-ink bg-blush text-ink font-semibold'
                            : 'border-ink/15 bg-canvas text-ink hover:border-ink/40'
                        }`}
                      >
                        {active && <Icon icon={CheckIcon} size="xs" />}
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-2xs font-semibold text-ink/75">{pCopy.smokingLabel}</p>
                <div className="flex flex-wrap gap-1.5">
                  {SMOKING_KEYS.map((sk) => (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => setSmokingDraft(sk)}
                      className={`rounded-full border px-2.5 py-1 text-2xs font-medium cursor-pointer ${
                        smokingDraft === sk
                          ? 'border-ink bg-ink text-white'
                          : 'border-ink/15 bg-canvas text-ink hover:border-ink/40'
                      }`}
                    >
                      {pCopy.smokingOptions[sk]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-cream/70 border border-ink/10 p-3 text-2xs">
                <p className="font-semibold text-ink/75">{t.autoFocusLabel}</p>
                <p className="mt-0.5 font-medium text-ink">{previewFocus}</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-2xs font-medium text-ink/60 hover:text-ink cursor-pointer"
                >
                  ← {t.backBtn}
                </button>
                <button
                  type="button"
                  onClick={handleFinishGuidedOnboarding}
                  className="inline-flex items-center gap-1.5 rounded-full bg-orange px-4 py-1.5 text-2xs font-semibold text-white shadow-sm hover:bg-orange/90 cursor-pointer"
                >
                  <Icon icon={CheckIcon} size="xs" />
                  <span>{t.finishBtn}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Completed Profile Summary & Quick Regional/AI Adjustments */
        <>
          <div className="rounded-card border border-ink/10 bg-white p-4 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-ink/80"
                  aria-hidden="true"
                >
                  <Icon icon={countryCode ? LocationOnOutlinedIcon : PublicOutlinedIcon} size="sm" />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-ink">
                      {city ? `${city}, ` : ''}
                      {countryName}
                    </h3>
                    <span className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-3xs font-semibold uppercase text-ink/70">
                      {countryCode}
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-3xs text-ink/60">
                    {isConfirmed ? (
                      <>
                        <Icon icon={VerifiedOutlinedIcon} size="xs" className="text-ink/70" />
                        <span>Confirmed Regional Context</span>
                      </>
                    ) : (
                      <span>Detected via network / timezone</span>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsChangingRegion((prev) => !prev)}
                className="text-2xs font-semibold text-ink underline underline-offset-2 hover:text-ink/80 cursor-pointer"
              >
                {isChangingRegion ? 'Cancel' : copy.lifestyleTuning.changeLocationBtn}
              </button>
            </div>

            {isChangingRegion && renderRegionSelector()}
          </div>

          <div className="rounded-card border border-ink/10 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Icon icon={TuneIcon} size="xs" className="text-ink/60" />
                <h3 className="text-sm font-semibold text-ink">Active Lifestyle Factors</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setRerunGuided(true);
                  }}
                  className="text-3xs font-semibold text-ink underline underline-offset-2 hover:text-ink/75 cursor-pointer"
                >
                  {t.rerunBtn}
                </button>
                <span className="rounded-full bg-cream px-2 py-0.5 text-3xs font-semibold text-ink/75">
                  {activeTags.length} active
                </span>
              </div>
            </div>

            {activeTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {activeTags.map((tag) => {
                  const displayLabel = formatLifestyleTagLabel(tag);
                  const TagIcon = getLifestyleTagIcon(tag);
                  return (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-full border border-mint bg-mint/20 px-2.5 py-1 text-2xs font-medium text-ink"
                    >
                      <Icon icon={TagIcon} size="xs" className="text-ink/75" />
                      <span>{displayLabel}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="rounded-full p-0.5 hover:bg-ink/10 transition-colors cursor-pointer"
                        aria-label={`Remove ${displayLabel}`}
                      >
                        <Icon icon={CloseIcon} size="xs" />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-ink/70 leading-relaxed">
                {copy.lifestyleTuning.lifestyleIntro(city || countryName)}
              </p>
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="rounded-card border border-ink/10 bg-white p-4 shadow-2xs space-y-2.5">
              <h4 className="text-xs font-semibold text-ink">
                {copy.lifestyleTuning.suggestionsEyebrow(city || countryName)}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((suggestion) => {
                  const displayLabel = formatLifestyleTagLabel(suggestion.label);
                  const isSelected = activeTags.some((tItem) => formatLifestyleTagLabel(tItem) === displayLabel);
                  const TagIcon = getLifestyleTagIcon(displayLabel, suggestion.category);
                  return (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => handleChipClick(displayLabel)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'border-mint bg-mint text-ink font-semibold shadow-2xs'
                          : 'border-ink/20 bg-canvas text-ink hover:border-ink hover:bg-cream'
                      }`}
                    >
                      <Icon icon={isSelected ? CheckIcon : TagIcon} size="xs" className={isSelected ? 'text-ink' : 'text-ink/70'} />
                      <span>{displayLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Conversational Dialogue Log */}
      {messages.length > 0 && (
        <div className="space-y-3 pt-2">
          {messages.map((message) => (
            <AssistantMessage key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      )}
    </div>
  );
}
