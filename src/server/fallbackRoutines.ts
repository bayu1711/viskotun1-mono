import type { Routine, Protocol } from '../types/routine';
import { COPY } from '../data/copy';
import { classifyPaperSource } from './gatekeeper';

export const FALLBACK_CREATINE_SLEEP: Routine = {
  id: 'creatine-sleep',
  title: 'Creatine & Sleep Deprivation Cognitive Protocol',
  shortTitle: 'creatine sleep',
  icon: 'sleep',
  phase: 'Phase 1: Acute Loading',
  phaseLabel: 'loading',
  totalDays: 14,
  currentDay: 1,
  streak: 0,
  paper: {
    title:
      'Single Dose Creatine Monohydrate Enhances Cognitive Performance and Brain Bioenergetics During Acute Sleep Deprivation',
    fileName: 'Creatine_Sleep_Deprivation_RCT.pdf',
    authors: 'Gordji-Nejad A., Matusch A., Kleedörfer S., et al.',
    year: 2024,
    journal: 'Scientific Reports',
    doi: '10.1038/s41598-024-54249-9',
    sampleSize: 48,
    trialType: 'Double-Blind Placebo-Controlled Crossover RCT',
    evidenceBadges: ['rct', 'missing-parameters'],
    pages: 12
  },
  steps: [
    {
      id: 'cr-1',
      tone: 'orange',
      icon: 'pill',
      action: 'Morning Creatine Monohydrate Ingestion',
      detail: 'Take 5g micronized creatine monohydrate dissolved in warm water with a light meal.',
      sets: 1,
      reps: 1,
      frequency: '1x Daily',
      setLabel: 'doses',
      perSetLabel: '× 5g',
      statLabel: 'dose:',
      statValue: '5g'
    },
    {
      id: 'cr-2',
      tone: 'sky',
      icon: 'brain',
      action: 'Cognitive Vigilance Task (PVT)',
      detail: 'Complete 10-minute reaction time psychomotor vigilance assessment.',
      sets: 1,
      reps: 1,
      frequency: '1x Daily',
      durationSeconds: 600,
      setLabel: 'session',
      perSetLabel: '× 10 min',
      statLabel: 'duration:',
      statValue: '10m'
    },
    {
      id: 'cr-3',
      tone: 'mint',
      icon: 'water',
      action: 'Standardized Fluid Ingestion',
      detail:
        'Authors noted participants maintained fluid intake alongside creatine, but omitted exact hourly volume. Conservative baseline applied.',
      sets: 4,
      reps: 1,
      frequency: 'Throughout Day',
      setLabel: 'servings',
      perSetLabel: '× 500 mL',
      statLabel: 'target:',
      statValue: '500 mL',
      inferred: true,
      inferredProvenance: {
        tier: 'guideline',
        source: 'Clinical Hydration Standard',
        rationale: 'Standard fluid intake alongside creatine supplementation'
      }
    }
  ],
  progressionRules: [
    {
      id: 'cr-rule-1',
      condition: 'Gastrointestinal tolerance score remains 0/10 for 5 consecutive days',
      action: 'Transition from acute loading to daily cognitive maintenance (3g/day)'
    },
    {
      id: 'cr-rule-2',
      condition: 'Subjective gastric distress score ≥ 3/10',
      action: 'Split daily 5g dose into two 2.5g servings taken with breakfast and lunch'
    }
  ],
  contraindications: [
    {
      id: 'cr-c-1',
      text: 'Do not take on an empty stomach if you have pre-existing gastric acid sensitivity.',
      severity: 'caution'
    },
    {
      id: 'cr-c-2',
      text: 'Discontinue immediately if renal filtration impairment or acute swelling is suspected.',
      severity: 'stop'
    }
  ],
  missingDataFlags: [
    {
      stepId: 'cr-3',
      parameter: 'Co-ingestion hydration volume & schedule',
      fallback: 'Conservative baseline: 4 × 500 mL water spaced across the waking day',
      sourceGuideline: 'Clinical Hydration Standard'
    }
  ],
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
    escalationMessage: 'Gastric distress threshold exceeded (≥ 3/10). Escalation paused. Split daily 5g dose into two 2.5g servings with meals.'
  },
  dataCollectionSpec: [
    {
      id: 'cr-pvt-timer',
      name: 'Reaction Time (PVT)',
      label: 'Psychomotor Vigilance Test (PVT)',
      type: 'timer',
      frequency: 'daily',
      unit: 'seconds',
      min: 10,
      max: 600,
      step: 1,
      instructions: 'Record reaction time performance across standard 10-minute assessment window.'
    },
    {
      id: 'cr-sleepiness-scale',
      name: 'Stanford Sleepiness Score',
      label: 'Subjective Alertness Assessment',
      type: 'multichoice',
      frequency: 'daily',
      options: [
        '1 · Feeling active, vital, alert, or wide awake',
        '2 · Functioning at high levels, but not at peak',
        '3 · Awake, but relaxed; responsive but not fully alert',
        '4 · Somewhat foggy, let down',
        '5 · Foggy; losing interest in remaining awake; slowed down',
        '6 · Sleepy, woozy, fighting sleep; prefer to lie down',
        '7 · No longer fighting sleep, sleep onset imminent'
      ],
      instructions: 'Select acute alertness state prior to cognitive evaluation.'
    },
    {
      id: 'cr-distress-scale',
      name: 'GI distress',
      label: 'GI distress / tolerance',
      type: 'scale',
      frequency: 'daily',
      min: 0,
      max: 10,
      step: 1,
      escalationThreshold: 3,
      escalationMessage: 'Gastric distress threshold exceeded (≥ 3/10). Escalation paused. Split daily 5g dose into two 2.5g servings with meals.'
    }
  ],
  initialMorphingLogs: [],
  initialFeedbackLogs: [],
  initialMessages: [
    {
      id: 'cr-msg-1',
      role: 'user',
      kind: 'file',
      content: 'Creatine_Sleep_Deprivation_RCT.pdf',
      timestamp: '9:00 AM'
    },
    {
      id: 'cr-msg-2',
      role: 'ai',
      kind: 'text',
      content:
        'Parsed 12 pages and isolated the Methods & Interventions section. Theoretical discussions on mitochondrial respiration were safely excluded.',
      timestamp: '9:01 AM'
    },
    {
      id: 'cr-msg-3',
      role: 'ai',
      kind: 'protocol',
      content: 'creatine-sleep',
      timestamp: '9:01 AM'
    }
  ],
  community: {
    studyEfficacy: 84,
    realWorldEfficacy: 50,
    userCount: 2,
    medianAdherence: 82,
    dropOffUnit: 'day',
    peakPeriod: 4,
    dropOff: [
      { period: 1, dropOff: 3 },
      { period: 2, dropOff: 6 },
      { period: 3, dropOff: 11 },
      { period: 4, dropOff: 38 },
      { period: 7, dropOff: 14 },
      { period: 10, dropOff: 8 },
      { period: 14, dropOff: 5 }
    ],
    insightLead: '38% drop-off spike on Day 4',
    insightRest: 'typically related to mild initial GI bloating. Take with food to stay adherent.',
    reviews: [
      {
        id: 'cr-rev-1',
        userId: 'user-cr-shift-28m',
        handle: 'Anonymous · 28M · Shift Worker',
        day: 7,
        outcome: 'improved',
        text: 'Kept me razor sharp through 36-hour rotating shifts without the jitters of excessive caffeine.',
        adherence: 94
      },
      {
        id: 'cr-rev-2',
        userId: 'user-cr-clin-34f',
        handle: 'Anonymous · 34F · Clinical Specialist',
        day: 4,
        outcome: 'adjusted',
        text: 'Split the 5g into 2.5g twice daily per the safety rule when mild nausea appeared. Smooth sailing after.',
        adherence: 86
      }
    ]
  },
  faqs: [
    {
      question: 'why take 5g instead of the standard 3g maintenance?',
      keywords: ['5g', 'dose', 'loading', 'amount', 'standard'],
      answer:
        'The acute cognitive trial tested 0.3g/kg or a standard 5g acute loading dose to rapidly saturate cerebral phosphocreatine stores during sleep loss (Methods, p. 3).'
    },
    {
      question: 'can I take this with coffee?',
      keywords: ['coffee', 'caffeine', 'tea', 'drink'],
      answer:
        'The study controlled caffeine intake during the trial period. While low doses of caffeine do not negate creatine, avoid taking them simultaneously if GI distress occurs.'
    },
    {
      question: 'when do I drop to maintenance?',
      keywords: ['maintenance', 'phase 2', 'progress', 'advance'],
      answer:
        'Per the progression rules: once GI tolerance is sustained for 5 consecutive days, you can step down to the standard 3g daily maintenance dose.'
    }
  ]
};

export const FALLBACK_PATELLAR_REHAB: Protocol = {
  id: 'patellar-rehab',
  title: 'Patellar Tendinopathy Heavy Slow Resistance',
  shortTitle: 'patellar rehab',
  icon: 'bent-knee',
  phase: 'Phase 1: Week 1–2',
  phaseLabel: 'week 1',
  totalDays: 14,
  currentDay: 1,
  streak: 0,
  paper: {
    title: 'Heavy Slow Resistance Versus Eccentric Training for Patellar Tendinopathy: A Randomized Trial',
    fileName: 'Patellar_HSR_Tendinopathy.pdf',
    authors: 'Kongsgaard M., Kovanen V., Aagaard P.',
    year: 2023,
    journal: 'The American Journal of Sports Medicine',
    doi: '10.1177/0363546509337183',
    sampleSize: 40,
    trialType: 'Randomized Controlled Trial',
    evidenceBadges: ['rct', 'missing-parameters'],
    pages: 11
  },
  steps: [
    {
      id: 'pat-1',
      tone: 'orange',
      icon: 'bent-knee',
      action: 'Bilateral Squat (Heavy Slow Resistance)',
      detail: '3s concentric, 3s eccentric cadence. Moderate load allowing strict form.',
      sets: 4,
      reps: 8,
      frequency: '3x Weekly',
      tempo: '3s up, 3s down',
      statLabel: 'tempo:',
      statValue: '3s / 3s'
    },
    {
      id: 'pat-2',
      tone: 'yellow',
      icon: 'fitness',
      action: 'Leg Press (Heavy Slow Resistance)',
      detail: 'Controlled knee flexion up to 90 degrees, slow sustained eccentric phase.',
      sets: 4,
      reps: 8,
      frequency: '3x Weekly',
      tempo: '3s eccentric'
    },
    {
      id: 'pat-3',
      tone: 'lavender',
      icon: 'stretch',
      action: 'Decline Board Isometric Hold',
      detail:
        'Authors stated "isometric decline squats were used for warm-up" without reporting hold time. Conservative 45s hold defaulted.',
      sets: 3,
      reps: 1,
      frequency: 'Daily',
      durationSeconds: 45,
      inferred: true
    }
  ],
  progressionRules: [
    {
      id: 'pat-rule-1',
      condition: 'Tendon discomfort remains ≤ 3/10 during and after sessions for 1 full week',
      action: 'Increase resistance load by 2.5kg to 5kg on bilateral squats'
    },
    {
      id: 'pat-rule-2',
      condition: 'Next-day morning tendon stiffness or discomfort score ≥ 5/10',
      action: 'Hold current load and insert an extra 24h rest window'
    }
  ],
  contraindications: [
    {
      id: 'pat-c-1',
      text: 'Stop immediately if sharp, stabbing discomfort reaches 4/10 or joint locking occurs.',
      severity: 'stop'
    },
    {
      id: 'pat-c-2',
      text: 'Do not perform dynamic jumping or explosive plyometrics while in Phase 1.',
      severity: 'caution'
    }
  ],
  missingDataFlags: [
    {
      stepId: 'pat-3',
      parameter: 'Decline board isometric hold duration',
      fallback: 'Conservative baseline: 3 × 45s isometric hold'
    }
  ],
  dayHistory: [],
  initialSetsDone: {},
  feedbackMetric: {
    name: 'tendon discomfort',
    label: 'tendon discomfort / load tolerance',
    eyebrow: 'tendon discomfort',
    logTitle: 'log',
    minLabel: '0 · none',
    maxLabel: '10 · severe',
    maxScore: 10,
    escalationThreshold: 4,
    escalationMessage: 'Tendon discomfort threshold exceeded (≥ 4/10). Escalation paused. Recommendation: Reduce resistance load by 20% tomorrow or consult a specialist.'
  },
  dataCollectionSpec: [
    {
      id: 'pat-pain-scale',
      name: 'Tendon Discomfort',
      label: 'Tendon Discomfort (VAS 0–10)',
      type: 'scale',
      frequency: 'daily',
      min: 0,
      max: 10,
      step: 1,
      escalationThreshold: 4,
      escalationMessage: 'Tendon discomfort threshold exceeded (≥ 4/10). Escalation paused. Reduce resistance load by 20% tomorrow.'
    },
    {
      id: 'pat-knee-angle',
      name: 'Knee Flexion Angle',
      label: 'Active Knee Flexion Range of Motion',
      type: 'numeric',
      frequency: 'weekly',
      unit: '°',
      min: 0,
      max: 150,
      step: 1,
      instructions: 'Measure active knee flexion angle in prone position with goniometer aligned to lateral femoral condyle.'
    }
  ],
  initialMorphingLogs: [],
  initialFeedbackLogs: [],
  initialMessages: [
    {
      id: 'pat-msg-1',
      role: 'user',
      kind: 'file',
      content: 'Patellar_HSR_Tendinopathy.pdf',
      timestamp: '10:15 AM'
    },
    {
      id: 'pat-msg-2',
      role: 'ai',
      kind: 'text',
      content:
        'Parsed 11 pages and isolated the Heavy Slow Resistance protocol. Discussion and surgical references were excluded.',
      timestamp: '10:16 AM'
    },
    {
      id: 'pat-msg-3',
      role: 'ai',
      kind: 'protocol',
      content: 'patellar-rehab',
      timestamp: '10:16 AM'
    }
  ],
  community: {
    studyEfficacy: 80,
    realWorldEfficacy: 100,
    userCount: 1,
    medianAdherence: 74,
    dropOffUnit: 'week',
    peakPeriod: 2,
    dropOff: [
      { period: 1, dropOff: 6 },
      { period: 2, dropOff: 42 },
      { period: 3, dropOff: 18 },
      { period: 4, dropOff: 10 }
    ],
    insightLead: '42% drop-off in Week 2',
    insightRest: 'due to heavy eccentric muscle soreness. Soreness is normal; sharp tendon strain is not.',
    reviews: [
      {
        id: 'pat-rev-1',
        handle: 'Anonymous · 25M · Volleyball',
        day: 10,
        outcome: 'improved',
        text: 'Discomfort on stairs decreased from 6/10 to 1/10 by adherence to the 3s tempo.',
        adherence: 95
      }
    ]
  },
  faqs: [
    {
      question: 'why slow cadence (3 seconds up, 3 seconds down)?',
      keywords: ['cadence', 'tempo', 'slow', 'speed', 'seconds'],
      answer:
        'Heavy slow loading produces continuous high tendon strain without high-impact peaks, maximizing collagen synthesis and tendon stiffness (Methods, p. 5).'
    },
    {
      question: 'is discomfort during the exercise acceptable?',
      keywords: ['discomfort', 'soreness', 'acceptable', 'hurt', 'safe'],
      answer:
        'Yes, mild discomfort up to 3/10 is considered safe and therapeutic during tendon remodeling. If discomfort reaches 4/10 or higher, stop the exercise.'
    }
  ]
};

/** Backward-compatible wrapper around the local gatekeeper. */
export function isTheoreticalOrNonHuman(input: string): { declined: boolean; reason?: string } {
  const verdict = classifyPaperSource(input);
  return verdict.declined ? { declined: true, reason: verdict.reason } : { declined: false };
}

export function generateFallbackRoutine(source: string): Routine {
  const normalized = source.toLowerCase();
  if (normalized.includes('sleep') || normalized.includes('creatine') || normalized.includes('brain') || normalized.includes('cognitive')) {
    return FALLBACK_CREATINE_SLEEP;
  }
  if (normalized.includes('knee') || normalized.includes('patellar') || normalized.includes('squat') || normalized.includes('tendon')) {
    return FALLBACK_PATELLAR_REHAB;
  }

  // Generic customized protocol based on source
  const cleanTitle = source
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'extracted-protocol';

  return {
    id: slug,
    title: cleanTitle,
    shortTitle: cleanTitle.split(' ').slice(0, 2).join(' ').toLowerCase(),
    icon: 'science',
    phase: COPY.fallbackProtocol.phase,
    phaseLabel: COPY.fallbackProtocol.phaseLabel,
    totalDays: 14,
    currentDay: 1,
    streak: 1,
    paper: {
      title: cleanTitle,
      fileName: source.endsWith('.pdf') ? source : `${slug}.pdf`,
      authors: COPY.fallbackProtocol.authors,
      year: 2024,
      journal: COPY.fallbackProtocol.journal,
      doi: `10.1016/j.jihs.${slug.slice(0, 8)}`,
      sampleSize: 44,
      trialType: COPY.fallbackProtocol.trialType,
      evidenceBadges: ['rct', 'missing-parameters'],
      pages: 10
    },
    steps: [
      {
        id: `${slug}-1`,
        tone: 'orange',
        icon: 'science',
        action: COPY.fallbackProtocol.step1Action,
        detail: COPY.fallbackProtocol.step1Detail,
        sets: 1,
        reps: 1,
        frequency: COPY.fallbackProtocol.step1Frequency,
        setLabel: COPY.fallbackProtocol.step1SetLabel,
        perSetLabel: COPY.fallbackProtocol.step1PerSetLabel,
        statLabel: COPY.fallbackProtocol.step1StatLabel,
        statValue: COPY.fallbackProtocol.step1StatValue
      },
      {
        id: `${slug}-2`,
        tone: 'yellow',
        icon: 'timer',
        action: COPY.fallbackProtocol.step2Action,
        detail: COPY.fallbackProtocol.step2Detail,
        sets: 3,
        reps: 1,
        frequency: COPY.fallbackProtocol.step2Frequency,
        durationSeconds: 30,
        inferred: true,
        inferredProvenance: {
          tier: 'guideline',
          source: 'ACSM Clinical Guidelines',
          rationale: COPY.fallbackProtocol.step2Detail
        }
      }
    ],
    progressionRules: [
      {
        id: `${slug}-rule-1`,
        condition: COPY.fallbackProtocol.progressionCondition,
        action: COPY.fallbackProtocol.progressionAction
      }
    ],
    contraindications: [
      {
        id: `${slug}-c-1`,
        text: COPY.fallbackProtocol.contraindicationText,
        severity: 'stop'
      }
    ],
    missingDataFlags: [
      {
        stepId: `${slug}-2`,
        parameter: COPY.fallbackProtocol.missingParameter,
        fallback: COPY.fallbackProtocol.missingFallback,
        sourceGuideline: 'ACSM Clinical Guidelines'
      }
    ],
    dayHistory: [],
    initialSetsDone: { [`${slug}-1`]: 1, [`${slug}-2`]: 0 },
    feedbackMetric: {
      name: COPY.fallbackProtocol.metricName,
      label: COPY.fallbackProtocol.metricLabel,
      eyebrow: COPY.fallbackProtocol.eyebrow,
      logTitle: COPY.fallbackProtocol.logTitle,
      minLabel: COPY.feedbackDrawer.minLabel(0),
      maxLabel: COPY.feedbackDrawer.maxLabel(10),
      maxScore: 10,
      escalationThreshold: 4,
      escalationMessage: COPY.safety.baselineEscalationAlert
    },
    initialFeedbackLogs: [],
    initialMessages: [
      {
        id: `${slug}-msg-1`,
        role: 'user',
        kind: 'file',
        content: source,
        timestamp: COPY.assistant.timestampJustNow
      },
      {
        id: `${slug}-msg-2`,
        role: 'ai',
        kind: 'text',
        content: COPY.assistant.parsedSummary(12),
        timestamp: COPY.assistant.timestampJustNow
      },
      {
        id: `${slug}-msg-3`,
        role: 'ai',
        kind: 'protocol',
        content: slug,
        timestamp: COPY.assistant.timestampJustNow
      }
    ],
    community: {
      studyEfficacy: 81,
      realWorldEfficacy: 100,
      userCount: 1,
      medianAdherence: 78,
      dropOffUnit: COPY.fallbackProtocol.dropOffUnit,
      peakPeriod: 7,
      dropOff: [
        { period: 1, dropOff: 4 },
        { period: 3, dropOff: 12 },
        { period: 7, dropOff: 35 },
        { period: 14, dropOff: 10 }
      ],
      insightLead: COPY.community.fallbackInsightLead,
      insightRest: COPY.community.fallbackInsightRest,
      reviews: [
        {
          id: `${slug}-rev-1`,
          handle: COPY.community.fallbackReviewHandle,
          day: 7,
          outcome: 'improved',
          text: COPY.community.fallbackReviewText,
          adherence: 90
        }
      ]
    },
    faqs: [
      {
        question: COPY.assistant.fallbackFaqQuestion,
        keywords: ['evidence', 'grade', 'rct', 'trial'],
        answer: COPY.assistant.fallbackFaqAnswer
      }
    ]
  };
}

export const generateFallbackProtocol = generateFallbackRoutine;
export const FALLBACK_PATELLAR_ROUTINE = FALLBACK_PATELLAR_REHAB;
