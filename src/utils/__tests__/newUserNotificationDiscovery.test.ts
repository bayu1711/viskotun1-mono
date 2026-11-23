import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LocaleProvider } from '../../contexts/LocaleContext';
import { AssistantHeader } from '../../components/assistant/AssistantHeader';
import { RoutineDiscoveryCard } from '../../components/assistant/RoutineDiscoveryCard';
import { COPY } from '../../data/copy';
import { COPY_AR_OVERRIDE } from '../../data/locales/ar';
import { SAMPLE_PAPERS } from '../../data/samplePapers';
import { getLifestyleMatchedPresets, matchCommunityPapers } from '../paperQuery';

const inLocale = (el: React.ReactElement) => React.createElement(LocaleProvider, null, el);

describe('New User Discovery, Lifestyle Presets, and On-Device Label Removal', () => {
  it('does not display On-Device Gemma or engine labels in AssistantHeader', () => {
    const html = renderToStaticMarkup(
      inLocale(
        React.createElement(AssistantHeader, {
          titleId: 'test-assistant-title',
          onClose: () => {},
          lastEngine: 'on-device-gemma'
        })
      )
    );

    expect(html).not.toContain('On-Device Gemma');
    expect(html).not.toContain('Cloud AI');
    expect(html).not.toContain('Server Gemma');
    expect(html).not.toContain('Local Rules');
    expect(html).toContain(COPY.assistant.medicalDisclaimerChip);
  });

  it('phrases the welcome question around which routine the user wants to get into', () => {
    expect(COPY.assistant.unifiedWelcomeNoRoutine).toMatch(
      /Which routine would you like to get into/i
    );
    expect(COPY.assistant.unifiedWelcomeNoRoutine).toContain('lifestyle');

    const arQuestion = COPY_AR_OVERRIDE.assistant?.unifiedWelcomeNoRoutine;
    expect(arQuestion).toBeDefined();
    expect(arQuestion).toContain('الروتين');
  });

  it('provides single chip option for PDF upload pointing toward attachment without UploadDropzone', () => {
    expect(COPY.assistant.attachPdfChip).toContain('📎');
    expect(COPY.assistant.attachPdfHint).toContain('📎');

    const sheetSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/assistant/AssistantSheet.tsx'),
      'utf-8'
    );
    const cardSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/assistant/RoutineDiscoveryCard.tsx'),
      'utf-8'
    );

    expect(sheetSource).not.toContain('<UploadDropzone');
    expect(cardSource).toContain('attachPdfChip');
    expect(cardSource).toContain('attachPdfHint');
    expect(cardSource).toContain('<HiddenPdfInput');
  });

  it('leads post-lifestyle completion directly into the routine question and lifestyle-matched presets', () => {
    const html = renderToStaticMarkup(
      inLocale(
        React.createElement(RoutineDiscoveryCard, {
          variant: 'post-lifestyle',
          lifestyleProfile: {
            region: {
              countryCode: 'AE',
              countryName: 'United Arab Emirates',
              city: 'Abu Dhabi',
              confirmed: true,
              detectedBy: 'user_selected'
            },
            climateSensitivity: 'summer_heat',
            isRamadanFastingObserver: true,
            culturalRhythms: ['ramadan_fasting'],
            smokingStatus: 'non_smoker',
            activeTags: ['summer_heat', 'ramadan_fasting'],
            intakeCompleted: true
          },
          samplePapers: SAMPLE_PAPERS,
          activeTab: 'goals',
          onTabChange: () => {},
          onAskQuestion: () => {},
          onSelectLifestyleChip: () => {},
          onStartLifestyleInterview: () => {},
          onLoadPreset: () => {},
          onFile: () => {}
        })
      )
    );

    expect(html).toContain(COPY.assistant.unifiedWelcomeNoRoutine);
    expect(html).toContain(COPY.assistant.lifestyleMatchedTitle);
    expect(html).toContain('Ramadan Circadian');
    expect(html).toContain('Circadian Light');
    expect(html).toContain(COPY.assistant.attachPdfChip);

    const sheetSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/assistant/AssistantSheet.tsx'),
      'utf-8'
    );
    expect(sheetSource).toContain('isPostLifestyleDiscovery');
    expect(sheetSource).toContain('variant="post-lifestyle"');
    expect(sheetSource).toContain('<LifestyleTuningView');
    // Lifestyle mode must be checked before active routine so Tune Lifestyle works with an active routine
    expect(sheetSource.indexOf(': isLifestyle ?')).toBeLessThan(sheetSource.indexOf(': routine ?'));
  });

  it('ranks calibrated presets accurately for saved lifestyle profiles', () => {
    const ramadanMatches = getLifestyleMatchedPresets(
      { isRamadanFastingObserver: true, culturalRhythms: ['ramadan_fasting'] },
      SAMPLE_PAPERS
    );
    expect(ramadanMatches[0]?.paper.id).toBe('uae-ramadan-metabolic');
    expect(ramadanMatches[0]?.reasonKey).toBe('ramadan_fasting');

    const smokingMatches = getLifestyleMatchedPresets(
      { smokingStatus: 'midwakh_dokha' },
      SAMPLE_PAPERS
    );
    expect(smokingMatches[0]?.paper.id).toBe('uae-midwakh-tapering');
    expect(smokingMatches[0]?.reasonKey).toBe('smoking');

    const heatMatches = getLifestyleMatchedPresets(
      {
        climateSensitivity: 'summer_heat',
        region: { countryCode: 'AE', countryName: 'UAE', confirmed: true, detectedBy: 'user_selected' }
      },
      SAMPLE_PAPERS
    );
    expect(heatMatches[0]?.paper.id).toBe('uae-heat-circadian');
    expect(heatMatches[0]?.reasonKey).toBe('summer_heat');

    const shiftMatches = getLifestyleMatchedPresets(
      { workPattern: 'shift_work' },
      SAMPLE_PAPERS
    );
    expect(shiftMatches[0]?.paper.id).toBe('creatine-sleep');
    expect(shiftMatches[0]?.reasonKey).toBe('shift_work');

    const jointMatches = getLifestyleMatchedPresets(
      { physicalCautions: ['Knee sensitivity'] },
      SAMPLE_PAPERS
    );
    expect(jointMatches[0]?.paper.id).toBe('achilles-rehab');
    expect(jointMatches[0]?.reasonKey).toBe('physical_caution');
  });

  it('matches lifestyle queries against calibrated presets (heat, fasting, shift work, smoking)', () => {
    const heatMatches = matchCommunityPapers('Extreme summer heat & hydration', SAMPLE_PAPERS);
    expect(heatMatches.some((p) => p.id === 'uae-heat-circadian')).toBe(true);

    const fastingMatches = matchCommunityPapers('Ramadan fasting metabolic schedule', SAMPLE_PAPERS);
    expect(fastingMatches.some((p) => p.id === 'uae-ramadan-metabolic' || p.id === 'time-restricted-eating')).toBe(true);

    const smokingMatches = matchCommunityPapers('Nicotine & Dokha harm reduction', SAMPLE_PAPERS);
    expect(smokingMatches.some((p) => p.id === 'uae-midwakh-tapering')).toBe(true);

    const kneeMatches = matchCommunityPapers('Joint-friendly knee rehab', SAMPLE_PAPERS);
    expect(kneeMatches.some((p) => p.id === 'achilles-rehab')).toBe(true);

    const fatigueMatches = matchCommunityPapers('Shift work cognitive fatigue', SAMPLE_PAPERS);
    expect(fatigueMatches.some((p) => p.id === 'creatine-sleep')).toBe(true);
  });

  it('omits Context Tuning jargon, removes back-to-discovery during onboarding, and offers Skip for now', () => {
    expect(COPY.lifestyleTuning.badge).not.toMatch(/Context Tuning/i);
    expect(COPY.lifestyleTuning.onboarding.skipForNow).toBe('Skip for now');

    const sheetSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/assistant/AssistantSheet.tsx'),
      'utf-8'
    );
    expect(sheetSource).not.toContain('copy.lifestyleTuning.badge');
    expect(sheetSource).not.toContain('copy.assistant.backToDiscovery');
    expect(sheetSource).toContain('copy.lifestyleTuning.onboarding.skipForNow');
  });

  it('keeps routine discovery results clean without broken-link error banners', () => {
    const guidanceCardSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/assistant/messages/PaperGuidanceCard.tsx'),
      'utf-8'
    );
    expect(guidanceCardSource).toContain("mode?: 'discovery' | 'link_error'");
    expect(guidanceCardSource).toContain('if (!isLinkError)');

    const layoutSource = fs.readFileSync(
      path.resolve(__dirname, '../../app/layout.tsx'),
      'utf-8'
    );
    expect(layoutSource).toContain('/icon.png?v=trialn1-2');
    expect(layoutSource).toContain('/favicon.ico?v=trialn1-2');
    expect(fs.existsSync(path.resolve(__dirname, '../../app/favicon.ico'))).toBe(false);
  });

  it('supports Option A add-another routine discovery excluding already-tracked routines', () => {
    const html = renderToStaticMarkup(
      inLocale(
        React.createElement(RoutineDiscoveryCard, {
          variant: 'add-another',
          lifestyleProfile: {
            region: {
              countryCode: 'AE',
              countryName: 'United Arab Emirates',
              city: 'Abu Dhabi',
              confirmed: true,
              detectedBy: 'user_selected'
            },
            climateSensitivity: 'summer_heat',
            isRamadanFastingObserver: true,
            culturalRhythms: ['ramadan_fasting'],
            smokingStatus: 'non_smoker',
            activeTags: ['summer_heat', 'ramadan_fasting'],
            intakeCompleted: true
          },
          samplePapers: SAMPLE_PAPERS,
          excludeRoutineIds: ['uae-ramadan-metabolic'],
          activeTab: 'lifestyle',
          onTabChange: () => {},
          onAskQuestion: () => {},
          onSelectLifestyleChip: () => {},
          onStartLifestyleInterview: () => {},
          onLoadPreset: () => {},
          onBrowseCommunity: () => {},
          onFile: () => {}
        })
      )
    );

    expect(html).toContain(COPY.assistant.addAnotherWelcome);
    expect(html).toContain(COPY.assistant.browseCommunityLink);
    expect(html).not.toContain('Ramadan Circadian');

    const topBarSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/layout/TopBar.tsx'),
      'utf-8'
    );
    const papersPanelSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/dashboard/PapersPanel.tsx'),
      'utf-8'
    );
    expect(topBarSource).toContain("openAssistant('upload')");
    expect(papersPanelSource).toContain("openAssistant('upload')");
    expect(papersPanelSource).toContain('copy.dashboard.addAnotherPrompt');
  });
});
