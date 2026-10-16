import type { Routine, Protocol } from '../../types/routine';

export const hairLossProtocol: Routine = {
  id: 'hair-loss',
  title: 'Androgenetic Alopecia Regrowth',
  shortTitle: 'hair regrowth',
  icon: 'serum',
  phase: 'Phase 1: Week 1–12',
  phaseLabel: 'week 4',
  totalDays: 84,
  currentDay: 23,
  streak: 11,
  paper: {
    title:
    'Microneedling Combined with Topical Minoxidil 5% for Androgenetic Alopecia: A Randomized Evaluator-Blinded Trial',
    fileName: 'Microneedling_Minoxidil_AGA_RCT.pdf',
    authors: 'Mehta S., Okafor L., Brandt J.',
    year: 2024,
    journal: 'International Journal of Trichology',
    doi: '10.4103/ijt.2024.0318',
    sampleSize: 100,
    trialType: 'Randomized Controlled Trial',
    evidenceBadges: ['rct'],
    pages: 11
  },
  steps: [
  {
    id: 'hair-1',
    tone: 'ink',
    icon: 'serum',
    action: 'Topical Minoxidil 5%',
    detail: 'Apply 1 mL to a dry scalp over the thinning area. Leave on for at least 4 hours.',
    sets: 2,
    reps: 1,
    frequency: '2x Daily',
    setLabel: 'doses',
    perSetLabel: '× 1 mL',
    statLabel: 'dose:',
    statValue: '1 mL'
  },
  {
    id: 'hair-2',
    tone: 'cream',
    icon: 'microneedle',
    action: 'Scalp Microneedling',
    detail: '1.5 mm dermaroller, passes in 4 directions until mild redness. Skip minoxidil for 24h after.',
    sets: 1,
    reps: 1,
    frequency: '1x Weekly',
    setLabel: 'session',
    perSetLabel: '× 1.5 mm roller',
    statLabel: 'depth:',
    statValue: '1.5 mm'
  },
  {
    id: 'hair-3',
    tone: 'mint',
    icon: 'shampoo',
    action: 'Ketoconazole 2% Shampoo',
    detail: 'Lather onto the scalp and leave for 3–5 minutes before rinsing.',
    sets: 1,
    reps: 1,
    frequency: '3x Weekly',
    setLabel: 'wash',
    perSetLabel: '× 3–5 min contact',
    statLabel: 'contact:',
    statValue: '3–5 min'
  }],

  progressionRules: [
  {
    id: 'hair-rule-1',
    condition: 'Scalp irritation stays below 2/10 for 3 consecutive logs',
    action: 'Keep weekly microneedling at 1.5 mm'
  },
  {
    id: 'hair-rule-2',
    condition: 'Irritation ≥ 4/10 after any session',
    action: 'Pause microneedling for 1 week and continue minoxidil only'
  }],

  contraindications: [
  {
    id: 'hair-c-1',
    text: 'Pause microneedling if scalp pain exceeds 3/10 or the skin breaks.',
    severity: 'stop'
  },
  {
    id: 'hair-c-2',
    text: 'Stop minoxidil and see a specialist if chest pain, dizziness or a racing heartbeat occurs.',
    severity: 'caution'
  }],

  missingDataFlags: [],
  dayHistory: [
  1, 1, 0.75, 1, 1, 1, 0.5, 1, 1, 1, 1, 0.75, 1, 1, 0.5, 1, 1, 1, 1, 1, 0.75, 1],

  initialSetsDone: { 'hair-1': 1, 'hair-2': 0, 'hair-3': 1 },
  feedbackMetric: {
    name: 'scalp irritation',
    label: 'scalp irritation / burning',
    eyebrow: 'scalp',
    logTitle: 'irritation',
    minLabel: '0 · calm',
    maxLabel: '10 · severe redness',
    maxScore: 10,
    escalationThreshold: 4,
    escalationMessage: 'Scalp irritation threshold exceeded (≥ 4/10). Escalation paused. Pause microneedling for 1 week and continue minoxidil only.'
  },
  dataCollectionSpec: [
    {
      id: 'hair-vertex-photo',
      name: 'Vertex Scalp Photo',
      label: 'Standardized Scalp Clinical Photo',
      type: 'photo',
      frequency: 'milestone',
      milestoneDays: [1, 14, 28, 56, 84],
      instructions: 'Take an overhead photograph under diffuse ambient lighting at approximately 30 cm distance.'
    },
    {
      id: 'hair-irritation-scale',
      name: 'Scalp Irritation',
      label: 'Scalp Erythema & Itching',
      type: 'scale',
      frequency: 'daily',
      min: 0,
      max: 10,
      step: 1,
      escalationThreshold: 4,
      escalationMessage: 'Scalp irritation threshold exceeded (≥ 4/10). Escalation paused. Pause microneedling for 1 week and continue minoxidil only.'
    }
  ],
  initialMorphingLogs: [
    {
      id: 'hair-m-1',
      fieldId: 'hair-vertex-photo',
      day: 1,
      value: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f7f5f0"/><circle cx="200" cy="150" r="80" fill="%23eedcc6"/><ellipse cx="200" cy="140" rx="35" ry="25" fill="%23dfcaa9" opacity="0.8"/><text x="200" y="270" font-family="monospace" font-size="12" fill="%232b2927" text-anchor="middle">Baseline Scalp Vertex (Day 1)</text></svg>',
      loggedAt: 'Day 1',
      note: 'Baseline standardized photographic documentation.'
    },
    {
      id: 'hair-m-2',
      fieldId: 'hair-irritation-scale',
      day: 16,
      value: 2,
      loggedAt: 'Mon',
      note: 'Mild redness after rolling.'
    },
    {
      id: 'hair-m-3',
      fieldId: 'hair-irritation-scale',
      day: 19,
      value: 1,
      loggedAt: 'Thu',
      note: 'Light itch from minoxidil.'
    }
  ],
  initialFeedbackLogs: [
  { id: 'hair-log-1', day: 16, score: 2, note: 'Mild redness after rolling.', loggedAt: 'Mon' },
  { id: 'hair-log-2', day: 19, score: 1, note: 'Light itch from minoxidil.', loggedAt: 'Thu' },
  { id: 'hair-log-3', day: 22, score: 1, note: '', loggedAt: 'Sun' }],

  initialMessages: [
  {
    id: 'hair-msg-1',
    role: 'user',
    kind: 'file',
    content: 'Microneedling_Minoxidil_AGA_RCT.pdf',
    timestamp: 'Sep 21'
  },
  {
    id: 'hair-msg-2',
    role: 'ai',
    kind: 'text',
    content:
    'Parsed 11 pages and isolated the treatment arm used in the Methods section. All parameters were reported — nothing had to be defaulted.',
    timestamp: 'Sep 21'
  },
  { id: 'hair-msg-3', role: 'ai', kind: 'protocol', content: 'hair-loss', timestamp: 'Sep 21' }],

  community: {
    studyEfficacy: 82,
    realWorldEfficacy: 61,
    userCount: 3480,
    medianAdherence: 57,
    dropOffUnit: 'week',
    peakPeriod: 3,
    dropOff: [4, 9, 58, 27, 18, 14, 11, 9, 8, 7, 6, 5].map((dropOff, index) => ({
      period: index + 1,
      dropOff
    })),
    insightLead: '58% of users struggle in Week 3',
    insightRest: 'when minoxidil shedding starts. It is expected and usually temporary.',
    reviews: [
    {
      id: 'hair-rev-1',
      handle: 'Anonymous · 31M · Norwood 3',
      day: 21,
      outcome: 'adjusted',
      text: 'Shedding spiked in week 3 and I nearly quit. Kept going — by week 9 the crown was visibly denser.',
      adherence: 84
    },
    {
      id: 'hair-rev-2',
      handle: 'Anonymous · 44M · Diffuse thinning',
      day: 35,
      outcome: 'paused',
      text: 'Microneedling at 1.5 mm caused pinpoint bleeding. Paused a week, then went back with lighter pressure.',
      adherence: 66
    },
    {
      id: 'hair-rev-3',
      handle: 'Anonymous · 27M · Temples',
      day: 84,
      outcome: 'improved',
      text: 'Finished 12 weeks. Hair count on the photo grid went up noticeably, mostly vellus hairs thickening.',
      adherence: 93
    },
    {
      id: 'hair-rev-4',
      handle: 'Anonymous · 38F · Female-pattern',
      day: 28,
      outcome: 'adjusted',
      text: 'Switched to the foam version of minoxidil because the liquid irritated my scalp. Much better.',
      adherence: 79
    }]

  },
  faqs: [
  {
    question: 'is shedding normal?',
    keywords: ['shed', 'losing', 'falling', 'more hair'],
    answer:
    'Yes. The authors report increased shedding in weeks 2–6 for 40% of participants as resting follicles re-enter the growth phase. It resolved without changes to the protocol.'
  },
  {
    question: 'why 1.5 mm needles?',
    keywords: ['needle', 'roller', 'depth', 'mm', 'microneedl'],
    answer:
    'The trial used a 1.5 mm dermaroller once a week, rolled in 4 directions until mild redness. Minoxidil was skipped for 24 hours afterwards to limit irritation.'
  },
  {
    question: 'when will I see results?',
    keywords: ['result', 'when', 'how long', 'see', 'regrow', 'work'],
    answer:
    'The first measurable hair-count gain was at week 12. 82% of the combined group showed a >50% response by investigator photo review.'
  },
  {
    question: 'what side effects were seen?',
    keywords: ['side', 'effect', 'irritation', 'itch', 'red', 'safe'],
    answer:
    'Mild scalp redness after microneedling and minoxidil itch were most common. No serious adverse events were reported in either arm.'
  }]

};

export const hairLossRoutine = hairLossProtocol;