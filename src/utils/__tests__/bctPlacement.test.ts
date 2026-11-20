import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { COPY } from '../../data/copy';
import { COPY_AR } from '../../data/locales';

describe('BCT Taxonomy Placement Architecture', () => {
  it('guarantees HealthAgeCard does not expose the BCT audit drawer button in stats header', () => {
    const cardPath = path.resolve(__dirname, '../../components/dashboard/HealthAgeCard.tsx');
    const content = fs.readFileSync(cardPath, 'utf-8');

    // The button that previously cluttered the stats header must be removed
    expect(content).not.toContain('openBctLedger');
    expect(content).not.toContain('bctLinkText');
  });

  it('guarantees HowToModal provides dedicated Habit Science (BCT) tab and audit triggers', () => {
    const modalPath = path.resolve(__dirname, '../../components/howto/HowToModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    // HowToModal must support the 'science' tab and provide access to the BCT Ledger
    expect(content).toContain("'guide', 'science', 'scope'");
    expect(content).toContain('openBctLedger');
    expect(content).toContain('sciencePillars');
    expect(content).toContain('inspectLedgerButton');
  });

  it('guarantees English and Arabic copy contracts for Habit Science (BCT) in How-To', () => {
    const enHowTo = COPY.howTo;
    const arHowTo = COPY_AR.howTo;

    // English
    expect(enHowTo.tabs.science).toBe('Habit science (BCT)');
    expect(enHowTo.scienceTitle).toContain('Why TrialN1 Habits Actually Stick');
    expect(enHowTo.sciencePillars).toHaveLength(3);
    expect(enHowTo.sciencePillars[0].code).toContain('BCT 8.7');
    expect(enHowTo.sciencePillars[1].code).toContain('BCT 11.2');
    expect(enHowTo.sciencePillars[2].code).toContain('BCT 1.2');
    expect(enHowTo.inspectLedgerButton).toBe('Inspect BCT Taxonomy Ledger');

    // Arabic parity
    expect(arHowTo?.tabs?.science).toContain('علوم العادات');
    expect(arHowTo?.scienceTitle).toContain('لماذا تستمر العادات');
    expect(arHowTo?.sciencePillars).toHaveLength(3);
    expect(arHowTo?.sciencePillars?.[0].code).toContain('BCT 8.7');
    expect(arHowTo?.sciencePillars?.[1].code).toContain('BCT 11.2');
    expect(arHowTo?.sciencePillars?.[2].code).toContain('BCT 1.2');
    expect(arHowTo?.inspectLedgerButton).toBe('استعراض تصنيف BCT السلوكي');
  });

  it('guarantees Landing architecture sequence includes 5 steps with Habit Science (BCT v1)', () => {
    const enLanding = COPY.landing;
    const arLanding = COPY_AR.landing;

    // English
    expect(enLanding.steps.step4Number).toBe('04');
    expect(enLanding.steps.step4Title).toContain('Habit Science');
    expect(enLanding.steps.step4Body).toContain('Behavior Change Techniques');
    expect(enLanding.steps.step5Number).toBe('05');
    expect(enLanding.steps.step5Title).toBe('Clinical Adherence Brief');

    // Arabic parity
    expect(arLanding?.steps?.step4Number).toBe('04');
    expect(arLanding?.steps?.step4Title).toContain('علوم السلوك');
    expect(arLanding?.steps?.step5Number).toBe('05');
    expect(arLanding?.steps?.step5Title).toContain('التقرير السريري');

    // Check Landing.tsx registers 5 steps
    const landingPath = path.resolve(__dirname, '../../views/Landing.tsx');
    const landingContent = fs.readFileSync(landingPath, 'utf-8');
    expect(landingContent).toContain('copy.landing.steps.step4Number');
    expect(landingContent).toContain('copy.landing.steps.step5Number');
  });
});
