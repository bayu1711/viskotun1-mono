'use client';

import React, { useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import { useLocale } from '../../contexts/LocaleContext';
import type { LocaleCopy } from '../../data/locales/types';
import type {
  RegionalLifestyleTag,
  UserLifestyleProfile,
  UserProfile
} from '../../types/auth';
import type { ChatMessage } from '../../types/routine';
import { formatRegionLabel, type LifestyleInterviewStage } from '../../utils/lifestyleInterview';
import HealingOutlinedIcon from '@mui/icons-material/HealingOutlined';
import {
  getCautionDisplayLabel,
  getLifestyleTagDisplayLabel,
  getLifestyleTagIcon
} from '../../utils/lifestyleTags';
import {
  MANAGED_LIFESTYLE_TAGS,
  normalizePhysicalCautions,
  resolveCulturalRhythms,
  syncLifestyleActiveTags
} from '../../utils/profile';
import { formatAvailabilitySummary } from '../../utils/schedule';
import { Icon } from '../ui/Icon';
import { AssistantMessage } from './AssistantMessage';
import { TypingIndicator } from './TypingIndicator';

interface LifestyleTuningViewProps {
  lifestyleProfile?: UserLifestyleProfile;
  userProfile?: UserProfile;
  messages: ChatMessage[];
  isTyping: boolean;
  stage: LifestyleInterviewStage;
  onInitConversation: (copy: LocaleCopy) => void;
  onRestartInterview: (copy: LocaleCopy) => void;
  onSuggestionsLoaded?: (suggestions: RegionalLifestyleTag[]) => void;
  onUpdateProfile?: (updates: Partial<UserLifestyleProfile>) => void;
}

export function LifestyleTuningView({
  lifestyleProfile,
  userProfile,
  messages,
  isTyping,
  stage,
  onInitConversation,
  onRestartInterview,
  onSuggestionsLoaded,
  onUpdateProfile
}: LifestyleTuningViewProps) {
  const { copy, locale } = useLocale();

  const region = lifestyleProfile?.region;
  const countryCode = region?.countryCode || '';
  const countryName = region?.countryName || '';
  const city = region?.city || '';
  const regionLabel = formatRegionLabel(region);
  const activeTags = lifestyleProfile?.activeTags || [];
  const culturalRhythmParam = resolveCulturalRhythms(lifestyleProfile).slice().sort().join(',');
  const needsOnboarding = !lifestyleProfile?.intakeCompleted;

  // Seed the opening AI question as soon as the lifestyle thread opens
  useEffect(() => {
    if (messages.length === 0) {
      onInitConversation(copy);
    }
  }, [messages.length, onInitConversation, copy]);

  // Keep footer quick-reply suggestions synced with the user's region & cultural rhythms
  useEffect(() => {
    if (!countryCode) return;
    let active = true;
    async function loadSuggestions() {
      try {
        const params = new URLSearchParams({ country: countryCode });
        if (countryName) params.set('countryName', countryName);
        if (city) params.set('city', city);
        if (culturalRhythmParam) params.set('rhythms', culturalRhythmParam);
        const res = await fetch(`/api/lifestyle/tune?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            onSuggestionsLoaded?.(data.suggestions);
          }
        }
      } catch {
        // Fall back gracefully to static quick replies
      }
    }
    loadSuggestions();
    return () => {
      active = false;
    };
  }, [countryCode, countryName, city, culturalRhythmParam, onSuggestionsLoaded]);

  const cautions = normalizePhysicalCautions(lifestyleProfile?.physicalCautions);

  // Only custom habits are removable here; managed tags follow their /profile field.
  const handleRemoveTag = (tagToRemove: string) => {
    if (!onUpdateProfile) return;
    onUpdateProfile({ activeTags: activeTags.filter((tag) => tag !== tagToRemove) });
  };

  const handleRemoveCaution = (cautionToRemove: string) => {
    if (!onUpdateProfile || !lifestyleProfile) return;
    const nextCautions = cautions.filter((c) => c !== cautionToRemove);
    onUpdateProfile({
      physicalCautions: nextCautions,
      activeTags: syncLifestyleActiveTags({ ...lifestyleProfile, physicalCautions: nextCautions })
    });
  };

  const t = copy.lifestyleTuning.onboarding;
  const hasConfirmedRegion = Boolean(region?.confirmed && regionLabel);
  const hasAvailability =
    Boolean(userProfile?.availabilityMode) ||
    Boolean(userProfile?.availableWindows && userProfile.availableWindows.length > 0);
  const availabilityLabel = hasAvailability
    ? formatAvailabilitySummary(userProfile, undefined, locale)
    : null;
  const showRerunButton = !needsOnboarding && stage === 'complete';
  const hasContextChips =
    hasConfirmedRegion ||
    Boolean(availabilityLabel) ||
    activeTags.length > 0 ||
    cautions.length > 0;

  return (
    <div className="space-y-4">
      {/* Quiet, flat context strip — shows captured context live without form scaffolding */}
      {(hasContextChips || showRerunButton) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {hasConfirmedRegion && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cream/80 px-2.5 py-1 text-2xs font-medium text-ink">
                <Icon icon={LocationOnOutlinedIcon} size="xs" className="text-ink/70" />
                <span className="truncate">{regionLabel}</span>
              </span>
            )}

            {availabilityLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cream/80 px-2.5 py-1 text-2xs font-medium text-ink/85 tabular-nums">
                <Icon icon={ScheduleOutlinedIcon} size="xs" className="text-ink/65" />
                <span>{availabilityLabel}</span>
              </span>
            )}

            {activeTags.map((tag) => {
              const displayLabel = getLifestyleTagDisplayLabel(tag, copy);
              const TagIcon = getLifestyleTagIcon(tag);
              const canRemove = Boolean(onUpdateProfile) && !MANAGED_LIFESTYLE_TAGS.has(tag);
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 rounded-full border border-mint bg-mint/35 py-1 text-2xs font-medium text-ink ${canRemove ? 'ps-2.5 pe-1.5' : 'px-2.5'}`}
                >
                  <Icon icon={TagIcon} size="xs" className="text-ink/75" />
                  <span>{displayLabel}</span>
                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="rounded-full p-0.5 text-ink/70 hover:bg-ink/10 hover:text-ink transition-colors cursor-pointer"
                      aria-label={copy.profile.removeTagAria(displayLabel)}
                    >
                      <Icon icon={CloseIcon} size="xs" />
                    </button>
                  )}
                </span>
              );
            })}

            {cautions.map((caution) => {
              const displayLabel = getCautionDisplayLabel(caution, copy);
              return (
                <span
                  key={`caution-${caution}`}
                  className="inline-flex items-center gap-1 rounded-full border border-blush bg-blush/40 ps-2.5 pe-1.5 py-1 text-2xs font-medium text-ink"
                >
                  <Icon icon={HealingOutlinedIcon} size="xs" className="text-ink/75" />
                  <span>{displayLabel}</span>
                  {onUpdateProfile && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCaution(caution)}
                      className="rounded-full p-0.5 text-ink/70 hover:bg-ink/10 hover:text-ink transition-colors cursor-pointer"
                      aria-label={copy.profile.removeCautionAria(displayLabel)}
                    >
                      <Icon icon={CloseIcon} size="xs" />
                    </button>
                  )}
                </span>
              );
            })}
          </div>

          {showRerunButton && (
            <button
              type="button"
              onClick={() => onRestartInterview(copy)}
              className="shrink-0 py-1 text-2xs font-medium text-ink/70 underline underline-offset-4 hover:text-ink transition-colors cursor-pointer"
            >
              {t.rerunBtn}
            </button>
          )}
        </div>
      )}

      {/* Natural AI ↔ User conversation stream, matching Ask paper */}
      <div className="space-y-3">
        {messages.map((message) => (
          <AssistantMessage key={message.id} message={message} />
        ))}
        {isTyping && <TypingIndicator />}
      </div>
    </div>
  );
}
