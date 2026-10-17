import { describe, expect, it } from 'vitest';
import type { Routine } from '../../types/routine';
import { answerFor } from '../assistant';

const sampleProtocol: Routine = {
  id: 'creatine-test',
  title: 'Creatine Supplementation in Sleep Deprivation',
  shortTitle: 'creatine sleep',
  icon: 'brain',
  phase: 'Phase 1: Week 1',
  phaseLabel: 'week 1',
  totalDays: 7,
  currentDay: 1,
  streak: 1,
  paper: {
    title: 'Acute Cognitive Satiation via Creatine Monohydrate',
    fileName: 'Creatine_Cognitive.pdf',
    authors: 'Gordji-Nejad et al.',
    year: 2024,
    journal: 'Journal of Neuroscience',
    doi: '10.1523/JNEUROSCI.24',
    sampleSize: 15,
    trialType: 'Double-Blind RCT',
    evidenceBadges: ['rct'],
    pages: 14
  },
  steps: [
    {
      id: 'cr-1',
      tone: 'ink',
      icon: 'brain',
      action: 'Morning Creatine Dose',
      detail: '5g creatine monohydrate dissolved in water with breakfast.',
      sets: 1,
      reps: 1,
      frequency: '1x Daily',
      setLabel: 'dose',
      perSetLabel: '5g with food'
    }
  ],
  progressionRules: [
    {
      id: 'cr-prog-1',
      condition: 'GI tolerance sustained for 5 consecutive days',
      action: 'Transition from acute loading (5g) to maintenance (3g)'
    }
  ],
  contraindications: [
    {
      id: 'cr-c-1',
      text: 'Stop immediately if severe renal impairment or acute dehydration occurs.',
      severity: 'stop'
    },
    {
      id: 'cr-c-2',
      text: 'Avoid taking alongside high-dose caffeine if stomach irritation appears.',
      severity: 'caution'
    }
  ],
  missingDataFlags: [],
  dayHistory: [],
  initialSetsDone: {},
  feedbackMetric: {
    name: 'GI distress',
    label: 'GI distress / tolerance',
    eyebrow: 'tolerance',
    logTitle: 'distress',
    minLabel: '0 · none',
    maxLabel: '10 · severe nausea',
    maxScore: 10,
    escalationThreshold: 3,
    escalationMessage: 'Gastric distress threshold exceeded. Escalation paused. Split daily 5g dose into two 2.5g servings or consult a specialist.'
  },
  initialMessages: [],
  community: {
    studyEfficacy: 85,
    realWorldEfficacy: 80,
    userCount: 400,
    medianAdherence: 82,
    dropOffUnit: 'day',
    peakPeriod: 3,
    dropOff: [],
    insightLead: 'High adherence',
    insightRest: 'overall',
    reviews: []
  },
  faqs: [
    {
      question: 'can I take this with coffee?',
      keywords: ['coffee', 'tea'],
      answer: 'The trial controlled caffeine intake. Avoid concurrent intake if GI sensitivity occurs.'
    }
  ]
};

describe('Assistant answerFor generalization', () => {
  it('matches predefined FAQs based on keywords', () => {
    const answer = answerFor(sampleProtocol, 'can I drink coffee with this?');
    expect(answer).toContain('The trial controlled caffeine intake');
  });

  it('dynamically answers safety and stop rule inquiries', () => {
    const answer = answerFor(sampleProtocol, 'what are the safety rules and when should I stop?');
    expect(answer).toContain('Safety stop rule: Stop immediately if severe renal impairment');
    expect(answer).toContain('Additional study precaution: Avoid taking alongside high-dose caffeine');
  });

  it('dynamically answers progression criteria inquiries', () => {
    const answer = answerFor(sampleProtocol, 'how do I progress to the next phase?');
    expect(answer).toContain('Progression criteria: GI tolerance sustained for 5 consecutive days → Transition from acute loading (5g) to maintenance (3g)');
  });

  it('dynamically answers prescribed routine and dosage inquiries', () => {
    const answer = answerFor(sampleProtocol, 'what is my daily routine and dosage?');
    expect(answer).toContain('Prescribed daily routine: Morning Creatine Dose (1 dose, 1x Daily 5g with food)');
  });

  it('dynamically answers biofeedback tracking inquiries', () => {
    const answer = answerFor(sampleProtocol, 'how do I log my feedback score?');
    expect(answer).toContain('Daily biofeedback metric: GI distress (scale 0–10). Escalation threshold is ≥ 3/10.');
    expect(answer).toContain('consult a specialist');
  });

  it('dynamically provides paper evidence and citation information', () => {
    const answer = answerFor(sampleProtocol, 'tell me about the paper and authors');
    expect(answer).toContain('Study: "Acute Cognitive Satiation via Creatine Monohydrate"');
    expect(answer).toContain('Journal of Neuroscience (2024) by Gordji-Nejad et al.');
    expect(answer).toContain('Sample size: N = 15 (Double-Blind RCT)');
  });

  it('answers missing parameters inquiry when trial omitted parameters', () => {
    const protocolWithMissingData: Routine = {
      ...sampleProtocol,
      missingDataFlags: [
        {
          id: 'miss-1',
          stepId: 'cr-1',
          parameter: 'Hold duration',
          fallback: 'Conservative default 30s',
          sourceGuideline: 'ACSM 2020'
        }
      ],
      steps: [
        {
          ...sampleProtocol.steps[0],
          inferred: true,
          inferredProvenance: {
            tier: 'lineage',
            source: 'ACSM 2020 Guidelines'
          }
        }
      ]
    };

    const answer = answerFor(protocolWithMissingData, 'what parameters are missing or inferred?');
    expect(answer).toContain('The trial authors did not report all execution parameters');
    expect(answer).toContain('Hold duration');
    expect(answer).toContain('Conservative default 30s');
    expect(answer).toContain('ACSM 2020');
  });

  it('answers missing parameters inquiry when all parameters were reported', () => {
    const answer = answerFor(sampleProtocol, 'are there any missing parameters or omitted steps?');
    expect(answer).toContain('All execution parameters, dosages, and cadences were explicitly reported');
  });

  it('falls back gracefully when the question is out of scope', () => {
    const answer = answerFor(sampleProtocol, 'can this predict quantum gravity?');
    expect(answer).toContain("I couldn't find that in the Methods section");
    expect(answer).toContain('creatine sleep');
  });
});
