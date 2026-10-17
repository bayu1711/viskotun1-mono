import type { Routine, Protocol } from '../../types/routine';

export const achillesRoutine: Routine = {
  id: 'achilles',
  title: 'Achilles Tendinopathy Rehab',
  shortTitle: 'achilles rehab',
  icon: 'straight-knee',
  phase: 'Phase 1: Week 1–2',
  phaseLabel: 'week 1',
  totalDays: 84,
  currentDay: 1,
  streak: 0,
  paper: {
    title:
    'Eccentric Loading for Mid-Portion Achilles Tendinopathy: A Randomized Controlled Trial',
    fileName: 'Eccentric_Loading_Achilles_Tendinopathy.pdf',
    authors: 'Alfredson H., Nordin M., Keller T.',
    year: 2023,
    journal: 'Journal of Sports Rehabilitation',
    doi: '10.1016/j.jsr.2023.04.017',
    sampleSize: 42,
    trialType: 'Randomized Controlled Trial',
    evidenceBadges: ['rct', 'missing-parameters'],
    pages: 14
  },
  steps: [
  {
    id: 'ach-1',
    tone: 'orange',
    icon: 'straight-knee',
    action: 'Straight-Knee Eccentric Heel Drops',
    detail: 'Slow 3s lowering phase, full body weight on affected leg',
    sets: 3,
    reps: 15,
    frequency: '2x Daily',
    tempo: '3s eccentric'
  },
  {
    id: 'ach-2',
    tone: 'yellow',
    icon: 'bent-knee',
    action: 'Bent-Knee Eccentric Heel Drops',
    detail: 'Knee flexed ~30°, focus on soleus engagement',
    sets: 3,
    reps: 15,
    frequency: '2x Daily',
    tempo: '3s eccentric'
  },
  {
    id: 'ach-3',
    tone: 'mint',
    icon: 'stretch',
    action: 'Static Calf Stretch',
    detail:
    'Authors state "participants stretched the calf" without a hold time. Defaulted to a conservative 30s hold.',
    sets: 3,
    reps: 1,
    frequency: '1x Daily',
    durationSeconds: 30,
    inferred: true,
    inferredProvenance: {
      tier: 'guideline',
      source: 'ACSM Clinical Guidelines'
    }
  }],

  progressionRules: [
  {
    id: 'ach-rule-1',
    condition: 'Tendon discomfort remains below 2/10 for 3 consecutive days',
    action: 'Increase load by 5% (add weighted pack)'
  },
  {
    id: 'ach-rule-2',
    condition: 'Discomfort score ≥ 4/10 on any session',
    action: 'Pause escalation and reduce load by 20% the next day'
  }],

  contraindications: [
  { id: 'ach-c-1', text: 'Stop immediately if acute tendon discomfort exceeds 3/10.', severity: 'stop' },
  {
    id: 'ach-c-2',
    text: 'Skip the session if morning stiffness persists beyond 60 minutes.',
    severity: 'caution'
  }],

  missingDataFlags: [
  {
    stepId: 'ach-3',
    parameter: 'Hold duration for Static Calf Stretch',
    fallback: 'Conservative baseline: 3 × 30s hold',
    sourceGuideline: 'ACSM Clinical Guidelines'
  }],

  dayHistory: [],
  initialSetsDone: {},
  feedbackMetric: {
    name: 'tendon discomfort',
    label: 'tendon discomfort / load tolerance',
    eyebrow: 'discomfort',
    logTitle: 'log',
    minLabel: '0 · none',
    maxLabel: '10 · severe',
    maxScore: 10,
    escalationThreshold: 4,
    escalationMessage: 'Tendon discomfort threshold exceeded (≥ 4/10). Escalation paused. Recommendation: Reduce load by 20% tomorrow or consult a specialist.'
  },
  dataCollectionSpec: [
    {
      id: 'ach-pain-vas',
      name: 'Tendon Discomfort',
      label: 'Tendon Discomfort (VAS 0–10)',
      type: 'scale',
      frequency: 'daily',
      min: 0,
      max: 10,
      step: 1,
      escalationThreshold: 4,
      escalationMessage: 'Tendon discomfort threshold exceeded (≥ 4/10). Escalation paused. Reduce load by 20% tomorrow.'
    },
    {
      id: 'ach-dorsiflexion',
      name: 'Ankle Dorsiflexion Angle',
      label: 'Weight-Bearing Lunge Dorsiflexion',
      type: 'numeric',
      frequency: 'weekly',
      unit: '°',
      min: 0,
      max: 45,
      step: 1,
      instructions: 'Measure knee-to-wall distance or goniometer joint angle at maximum comfortable knee bend.'
    }
  ],
  initialMorphingLogs: [],
  initialFeedbackLogs: [],

  initialMessages: [
  {
    id: 'ach-msg-1',
    role: 'user',
    kind: 'file',
    content: 'Eccentric_Loading_Achilles_Tendinopathy.pdf',
    timestamp: '9:02 AM'
  },
  {
    id: 'ach-msg-2',
    role: 'ai',
    kind: 'text',
    content:
    'Parsed 14 pages and isolated the Methods & Interventions section. Background theory and discussion were ignored.',
    timestamp: '9:02 AM'
  },
  { id: 'ach-msg-3', role: 'ai', kind: 'routine', content: 'achilles', timestamp: '9:03 AM' }],

  community: {
    studyEfficacy: 80,
    realWorldEfficacy: 25,
    userCount: 4,
    medianAdherence: 68,
    dropOffUnit: 'day',
    peakPeriod: 11,
    dropOff: [2, 3, 6, 8, 12, 9, 14, 11, 16, 22, 65, 31, 18, 12].map((dropOff, index) => ({
      period: index + 1,
      dropOff
    })),
    insightLead: '65% of users struggle on Day 11',
    insightRest: 'due to the +5% intensity jump. Expect it, and go easy.',
    reviews: [
    {
      id: 'ach-rev-1',
      userId: 'user-ach-runner-41m',
      handle: 'Anonymous · 41M · Runner',
      day: 5,
      outcome: 'adjusted',
      text: 'Scaled load down by 10% on Day 5 due to soreness, recovered fully by Week 3.',
      adherence: 88
    },
    {
      id: 'ach-rev-2',
      userId: 'user-ach-desk-33f',
      handle: 'Anonymous · 33F · Desk worker',
      day: 11,
      outcome: 'paused',
      text: 'Day 11 escalation was too aggressive. Paused two days, then repeated Week 1 loading before progressing.',
      adherence: 61
    },
    {
      id: 'ach-rev-3',
      userId: 'user-ach-bball-29m',
      handle: 'Anonymous · 29M · Basketball',
      day: 14,
      outcome: 'improved',
      text: 'Finished Phase 1 at 0/10 discomfort. Morning stiffness dropped from 25 min to under 5 min.',
      adherence: 96
    },
    {
      id: 'ach-rev-4',
      userId: 'user-ach-hiker-52f',
      handle: 'Anonymous · 52F · Hiker',
      day: 8,
      outcome: 'adjusted',
      text: 'Bent-knee drops aggravated the tendon, so I kept the straight-knee variant only until Day 8.',
      adherence: 74
    }]

  },
  faqs: [
  {
    question: 'why 3 × 15 reps?',
    keywords: ['set', 'rep', 'how many', 'volume', '15'],
    answer:
    'The trial prescribed 3 sets of 15 reps for both heel-drop variants, twice daily, 7 days a week (Methods, p. 4). That volume was held constant through Phase 1.'
  },
  {
    question: 'is some discomfort okay?',
    keywords: ['discomfort', 'soreness', 'hurt', 'safe'],
    answer:
    'Yes — mild discomfort during loading was allowed. The stop rule is acute discomfort above 3/10. Past that, stop the session and log it so escalation pauses.'
  },
  {
    question: 'when do I add load?',
    keywords: ['progress', 'increase', 'load', 'weight', 'heavier', 'backpack'],
    answer:
    'Per the progression rule: once discomfort stays below 2/10 for 3 consecutive days, add 5% load using a weighted backpack.'
  },
  {
    question: 'why is the stretch defaulted?',
    keywords: ['stretch', 'hold', 'missing', 'default'],
    answer:
      'The authors only wrote "participants stretched the calf" with no hold time. Instead of guessing, I flagged it and applied a conservative 3 × 30s hold.'
    }
  ]
};

export const achillesProtocol = achillesRoutine;