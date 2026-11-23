import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LocaleProvider } from '../../contexts/LocaleContext';
import { AssistantHeader } from '../../components/assistant/AssistantHeader';
import { COPY } from '../../data/copy';
import { COPY_AR_OVERRIDE } from '../../data/locales/ar';
import { SAMPLE_PAPERS } from '../../data/samplePapers';
import { matchCommunityPapers } from '../paperQuery';

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

    // Verify engine chip label is completely removed from the header
    expect(html).not.toContain('On-Device Gemma');
    expect(html).not.toContain('Cloud AI');
    expect(html).not.toContain('Server Gemma');
    expect(html).not.toContain('Local Rules');

    // Clinical disclaimer chip should remain visible
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

  it('provides single chip option for PDF upload pointing toward attachment', () => {
    expect(COPY.assistant.attachPdfChip).toBeDefined();
    expect(COPY.assistant.attachPdfChip).toContain('📎');
    expect(COPY.assistant.attachPdfHint).toContain('📎');

    const sheetSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/assistant/AssistantSheet.tsx'),
      'utf-8'
    );

    // Verify the bulky separate UploadDropzone card is removed from AssistantSheet
    expect(sheetSource).not.toContain('<UploadDropzone');

    // Verify the single chip option and HiddenPdfInput are wired
    expect(sheetSource).toContain('attachPdfChip');
    expect(sheetSource).toContain('attachPdfHint');
    expect(sheetSource).toContain('<HiddenPdfInput');
  });

  it('provides lifestyle discovery option and wires interactive interview and preset chips', () => {
    expect(COPY.assistant.discoveryTabs.lifestyle).toBe('Lifestyle & Habits');
    expect(COPY.assistant.discoveryTabs.healthGoals).toBe('Health Conditions & Goals');
    expect(COPY.assistant.lifestyleChips.length).toBeGreaterThanOrEqual(5);

    const sheetSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/assistant/AssistantSheet.tsx'),
      'utf-8'
    );

    // Verify Lifestyle tab and LifestyleTuningView are wired
    expect(sheetSource).toContain('activeDiscoveryTab');
    expect(sheetSource).toContain('<LifestyleTuningView');
    expect(sheetSource).toContain('handleLifestyleChipSelect');
    expect(sheetSource).toContain('answerLifestyleQuestionsBtn');
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
});
