import { describe, expect, it } from 'vitest';
import {
  approveWidgetProposal,
  inferFallbackWidgetType,
  isSupportedWidgetType,
  listWidgetProposals,
  validateAndRegisterProtocolWidgets
} from '../widgetRegistry';
import { generateFallbackRoutine } from '../fallbackRoutines';

describe('AI Widget Validation & Human Oversight Registry', () => {
  it('validates supported built-in widget types', () => {
    expect(isSupportedWidgetType('scale')).toBe(true);
    expect(isSupportedWidgetType('numeric')).toBe(true);
    expect(isSupportedWidgetType('photo')).toBe(true);
    expect(isSupportedWidgetType('timer')).toBe(true);
    expect(isSupportedWidgetType('multichoice')).toBe(true);
    expect(isSupportedWidgetType('boolean')).toBe(true);
    expect(isSupportedWidgetType('breath-pacer')).toBe(false);
    expect(isSupportedWidgetType('rom-goniometer')).toBe(false);
  });

  it('infers safe fallback widget types for novel AI-requested widgets', () => {
    expect(inferFallbackWidgetType('breath-pacer-cadence', {})).toBe('timer');
    expect(inferFallbackWidgetType('dermal-scan-camera', {})).toBe('photo');
    expect(inferFallbackWidgetType('rom-goniometer', { unit: 'deg', max: 180 })).toBe('numeric');
    expect(inferFallbackWidgetType('symptom-matrix', { options: ['Low', 'High'] })).toBe('multichoice');
  });

  it('registers pending widget proposals when a custom paper has a novel endpoint and allows admin confirmation', async () => {
    const rawRoutine = generateFallbackRoutine('Respiratory_Cadence_Biofeedback_Trial.pdf');
    const validated = await validateAndRegisterProtocolWidgets(rawRoutine);

    const customField = validated.dataCollectionSpec?.find((f) => Boolean(f.proposedWidget));
    expect(customField).toBeDefined();
    expect(customField?.proposedWidget?.status).toBe('pending_review');

    const proposalId = customField!.proposedWidget!.id;
    const proposals = await listWidgetProposals();
    expect(proposals.some((p) => p.id === proposalId)).toBe(true);

    const approved = await approveWidgetProposal(proposalId);
    expect(approved?.status).toBe('approved');
    expect(approved?.approvedAt).toBeDefined();

    // Subsequent validations for the same paper automatically resolve the approved widget
    const revalidated = await validateAndRegisterProtocolWidgets(rawRoutine);
    const revalidatedField = revalidated.dataCollectionSpec?.find(
      (f) => f.proposedWidget?.id === proposalId
    );
    expect(revalidatedField?.proposedWidget?.status).toBe('approved');
  });
});
