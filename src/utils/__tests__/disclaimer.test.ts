import { describe, it, expect } from 'vitest';
import { stripClinicalDisclaimer } from '../disclaimer';

describe('stripClinicalDisclaimer', () => {
  it('handles empty or undefined inputs gracefully', () => {
    expect(stripClinicalDisclaimer('')).toBe('');
    expect(stripClinicalDisclaimer(undefined as unknown as string)).toBe('');
  });

  it('strips exact clinical advisory with medical disclaimer prefix', () => {
    const raw =
      '*** **Clinical Advisory:** Medical Disclaimer: ViskotuN1 provides educational routine extraction grounded strictly in human interventional clinical literature. It does not provide medical diagnosis, prescription, or replace personalized clinical supervision from a licensed physician or physical therapist.\n\nAccording to the study, perform eccentric heel drops twice daily.';
    expect(stripClinicalDisclaimer(raw)).toBe(
      'According to the study, perform eccentric heel drops twice daily.'
    );
  });

  it('strips clinical disclaimer when positioned at the end of the response', () => {
    const raw =
      'Progress by adding 5kg load once pain drops below 3/10.\n\n*** **Clinical Advisory:** Medical Disclaimer: ViskotuN1 provides educational routine extraction grounded strictly in human interventional clinical literature. It does not provide medical diagnosis, prescription, or replace personalized clinical supervision from a licensed physician or physical therapist.';
    expect(stripClinicalDisclaimer(raw)).toBe(
      'Progress by adding 5kg load once pain drops below 3/10.'
    );
  });

  it('strips plain Medical Disclaimer without Clinical Advisory header', () => {
    const raw =
      'Medical Disclaimer: ViskotuN1 provides educational routine extraction grounded strictly in human interventional clinical literature. It does not provide medical diagnosis, prescription, or replace personalized clinical supervision from a licensed physician or physical therapist.\n\nTake minoxidil 1ml daily.';
    expect(stripClinicalDisclaimer(raw)).toBe('Take minoxidil 1ml daily.');
  });

  it('leaves standard assistant responses unchanged', () => {
    const clean = 'Perform 3 sets of 15 repetitions on an elevated step with the knee straight.';
    expect(stripClinicalDisclaimer(clean)).toBe(clean);
  });
});
