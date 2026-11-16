'use client';

import React, { useEffect, useState } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import { COPY } from '../../data/copy';
import type { ChatMessage } from '../../types/routine';
import type { RegionalLifestyleTag, UserLifestyleProfile } from '../../types/auth';
import { AssistantMessage } from './AssistantMessage';
import { TypingIndicator } from './TypingIndicator';
import { Icon } from '../ui/Icon';

const PRESET_REGIONS = [
  { countryCode: 'AE', countryName: 'United Arab Emirates', city: 'Abu Dhabi', flag: '🇦🇪' },
  { countryCode: 'AE', countryName: 'United Arab Emirates', city: 'Dubai', flag: '🇦🇪' },
  { countryCode: 'SA', countryName: 'Saudi Arabia', city: 'Riyadh', flag: '🇸🇦' },
  { countryCode: 'GB', countryName: 'United Kingdom', city: 'London', flag: '🇬🇧' },
  { countryCode: 'US', countryName: 'United States', city: 'New York', flag: '🇺🇸' }
];

const DEFAULT_AE_SUGGESTIONS: RegionalLifestyleTag[] = [
  { id: 'tag-ramadan', label: '🌙 Ramadan Fasting Observer', category: 'culture', countryCode: 'AE', popularityCount: 980 },
  { id: 'tag-midwakh', label: '💨 Midwakh / Dokha Tobacco', category: 'substance', countryCode: 'AE', popularityCount: 840 },
  { id: 'tag-shisha', label: '💨 Shisha / Waterpipe', category: 'substance', countryCode: 'AE', popularityCount: 790 },
  { id: 'tag-shift', label: '🏥 Healthcare Shift Work', category: 'schedule', countryCode: 'AE', popularityCount: 710 },
  { id: 'tag-sedentary', label: '💻 Desk-bound Sedentary (>8 hrs)', category: 'schedule', countryCode: 'AE', popularityCount: 650 },
  { id: 'tag-heat', label: '🔥 Gulf Summer Heat Adaptation', category: 'environment', countryCode: 'AE', popularityCount: 590 }
];

interface LifestyleTuningViewProps {
  lifestyleProfile?: UserLifestyleProfile;
  messages: ChatMessage[];
  isTyping: boolean;
  onTune: (message: string) => Promise<unknown>;
  onConfirmRegion?: (countryName: string, city?: string) => void;
  onUpdateProfile?: (updates: Partial<UserLifestyleProfile>) => void;
}

export function LifestyleTuningView({
  lifestyleProfile,
  messages,
  isTyping,
  onTune,
  onConfirmRegion,
  onUpdateProfile
}: LifestyleTuningViewProps) {
  const [isChangingRegion, setIsChangingRegion] = useState(false);
  const [customCity, setCustomCity] = useState('');
  const [suggestions, setSuggestions] = useState<RegionalLifestyleTag[]>(DEFAULT_AE_SUGGESTIONS);

  const region = lifestyleProfile?.region;
  const countryCode = region?.countryCode || 'AE';
  const countryName = region?.countryName || 'United Arab Emirates';
  const city = region?.city || 'Abu Dhabi';
  const isConfirmed = region?.confirmed ?? false;
  const activeTags = lifestyleProfile?.activeTags || [];

  const flagEmoji =
    countryCode === 'AE'
      ? '🇦🇪'
      : countryCode === 'SA'
      ? '🇸🇦'
      : countryCode === 'GB'
      ? '🇬🇧'
      : countryCode === 'US'
      ? '🇺🇸'
      : '🌐';

  // Fetch popular regional suggestions for the selected country
  useEffect(() => {
    let active = true;
    async function loadSuggestions() {
      try {
        const res = await fetch(`/api/lifestyle/tune?country=${encodeURIComponent(countryCode)}`);
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
          }
        }
      } catch {
        // Fall back gracefully to preset suggestions
      }
    }
    loadSuggestions();
    return () => {
      active = false;
    };
  }, [countryCode]);

  const handleConfirmLocation = () => {
    if (onConfirmRegion) {
      onConfirmRegion(countryName, city);
    }
    setIsChangingRegion(false);
  };

  const handleSelectPresetRegion = (preset: typeof PRESET_REGIONS[0]) => {
    if (onConfirmRegion) {
      onConfirmRegion(preset.countryName, preset.city);
    }
    setIsChangingRegion(false);
  };

  const handleCustomRegionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCity.trim() || !onConfirmRegion) return;
    onConfirmRegion(customCity.trim(), customCity.trim());
    setCustomCity('');
    setIsChangingRegion(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!onUpdateProfile) return;
    const nextTags = activeTags.filter((t) => t !== tagToRemove);
    onUpdateProfile({ activeTags: nextTags });
  };

  const handleChipClick = (tagLabel: string) => {
    if (activeTags.includes(tagLabel)) {
      handleRemoveTag(tagLabel);
    } else {
      onTune(tagLabel);
    }
  };

  return (
    <div className="space-y-4">
      {/* Geolocation Card */}
      <div className="rounded-card border border-ink/10 bg-white p-4 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              {flagEmoji}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <Icon icon={LocationOnOutlinedIcon} size="xs" className="text-ink/60" />
                <h3 className="text-sm font-semibold text-ink">
                  {city ? `${city}, ` : ''}
                  {countryName}
                </h3>
              </div>
              <p className="text-3xs text-ink/60">
                {isConfirmed ? '✓ Confirmed Regional Context' : 'Detected via network / timezone'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsChangingRegion((prev) => !prev)}
            className="text-2xs font-semibold text-ink underline underline-offset-2 hover:text-ink/80 cursor-pointer"
          >
            {isChangingRegion ? 'Cancel' : COPY.lifestyleTuning.changeLocationBtn}
          </button>
        </div>

        {!isConfirmed && !isChangingRegion && (
          <div className="mt-3 rounded-tile bg-cream/70 p-3">
            <p className="text-xs text-ink/85 leading-relaxed">
              {COPY.lifestyleTuning.detectedLocationGreeting(countryName, city)}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmLocation}
                className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-2xs font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
              >
                <Icon icon={CheckIcon} size="xs" />
                <span>{COPY.lifestyleTuning.confirmLocationBtn(city || countryName)}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsChangingRegion(true)}
                className="rounded-full border border-ink/20 bg-white px-3 py-1 text-2xs font-medium text-ink transition-colors hover:border-ink cursor-pointer"
              >
                {COPY.lifestyleTuning.changeLocationBtn}
              </button>
            </div>
          </div>
        )}

        {isChangingRegion && (
          <div className="mt-3 space-y-2 border-t border-ink/10 pt-3">
            <p className="text-2xs font-medium text-ink/70">Select your tracking region:</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_REGIONS.map((preset) => (
                <button
                  key={`${preset.countryCode}-${preset.city}`}
                  type="button"
                  onClick={() => handleSelectPresetRegion(preset)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-2xs font-medium transition-colors cursor-pointer ${
                    preset.city === city
                      ? 'border-ink bg-ink text-white'
                      : 'border-ink/20 bg-canvas text-ink hover:border-ink'
                  }`}
                >
                  <span>{preset.flag}</span>
                  <span>{preset.city}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleCustomRegionSubmit} className="mt-2 flex gap-1.5">
              <input
                type="text"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                placeholder="Or type city / region (e.g. Al Ain, Sharjah, Doha)..."
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
        )}
      </div>

      {/* Active Lifestyle Profile Summary */}
      <div className="rounded-card border border-ink/10 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Icon icon={TuneIcon} size="xs" className="text-ink/60" />
            <h3 className="text-sm font-semibold text-ink">Active Lifestyle Factors</h3>
          </div>
          <span className="rounded-full bg-cream px-2 py-0.5 text-3xs font-semibold text-ink/75">
            {activeTags.length} active
          </span>
        </div>

        {activeTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {activeTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full border border-mint bg-mint/20 px-2.5 py-1 text-2xs font-medium text-ink"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="rounded-full p-0.5 hover:bg-ink/10 transition-colors cursor-pointer"
                  aria-label={`Remove ${tag}`}
                >
                  <Icon icon={CloseIcon} size="xs" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink/70 leading-relaxed">
            {COPY.lifestyleTuning.lifestyleIntro(city || countryName)}
          </p>
        )}
      </div>

      {/* Popular Regional Suggestions */}
      <div className="rounded-card border border-ink/10 bg-white p-4 shadow-2xs space-y-2.5">
        <h4 className="text-xs font-semibold text-ink">
          {COPY.lifestyleTuning.suggestionsEyebrow(city || countryName)}
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion) => {
            const isSelected = activeTags.includes(suggestion.label);
            return (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleChipClick(suggestion.label)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-2xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'border-mint bg-mint text-ink font-semibold shadow-2xs'
                    : 'border-ink/20 bg-canvas text-ink hover:border-ink hover:bg-cream'
                }`}
              >
                {isSelected && <Icon icon={CheckIcon} size="xs" />}
                <span>{suggestion.label}</span>
              </button>
            );
          })}
        </div>
      </div>

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
