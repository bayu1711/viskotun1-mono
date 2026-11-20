import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AnswerBubble } from '../../components/assistant/messages/AnswerBubble';
import { getEngineMeta } from '../../components/assistant/engineMeta';
import { COPY } from '../../data/copy';
import { COPY_AR_OVERRIDE } from '../../data/locales/ar';

describe('AI Engine attribution and chip privacy guardrails', () => {
  it('does not expose Gemini Flash model name in English copy dictionary', () => {
    expect(COPY.assistant.engines.cloudGemini).not.toMatch(/Gemini/i);
    expect(COPY.assistant.engines.cloudGemini).not.toMatch(/Flash/i);
    expect(COPY.assistant.engines.cloudGemini).toBe('Cloud AI');
  });

  it('does not expose Gemini Flash model name in Arabic copy dictionary', () => {
    const arCloud = COPY_AR_OVERRIDE.assistant?.engines?.cloudGemini;
    expect(arCloud).toBeDefined();
    expect(arCloud).not.toMatch(/Gemini/i);
    expect(arCloud).not.toMatch(/Flash/i);
  });

  it('omits model identifiers when cloud-gemini answers in AnswerBubble', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnswerBubble, {
        content: 'Take 5g creatine monohydrate daily with breakfast.',
        engine: 'cloud-gemini'
      })
    );

    // Verify model identifiers are completely absent
    expect(html).not.toContain('Gemini');
    expect(html).not.toContain('Flash');

    // Verify clinical grounding citation is cleanly displayed
    expect(html).toContain('Source · Methods section');
  });

  it('preserves custom clinical paper source for cloud-gemini without model chip', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnswerBubble, {
        content: 'Hydration protocol from Section 2.4.',
        engine: 'cloud-gemini',
        source: 'Methods · Section 2.4'
      })
    );

    expect(html).not.toContain('Gemini');
    expect(html).not.toContain('Flash');
    expect(html).toContain('Methods · Section 2.4');
  });

  it('retains on-device attribution for on-device-gemma when running locally', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnswerBubble, {
        content: 'Local inference answer.',
        engine: 'on-device-gemma'
      })
    );

    expect(html).toContain('On-Device Gemma');
    expect(html).not.toContain('Flash');
  });

  it('getEngineMeta returns Cloud AI label for cloud-gemini without model names', () => {
    const meta = getEngineMeta('cloud-gemini');
    expect(meta.label).toBe('Cloud AI');
    expect(meta.label).not.toMatch(/Gemini/i);
    expect(meta.label).not.toMatch(/Flash/i);
  });
});
