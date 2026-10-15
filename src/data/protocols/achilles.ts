import type { Protocol } from '../../types/protocol';

export const achillesProtocol: Protocol = {
  id: 'achilles',
  title: 'Achilles Tendinopathy Rehab',
  shortTitle: 'achilles rehab',
  icon: 'straight-knee',
  phase: 'Phase 1: Week 1–2',
  phaseLabel: 'week 2',
  totalDays: 14,
  currentDay: 4,
  streak: 4,
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
    tone: 'ink',
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
    tone: 'cream',
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
    inferred: true
  }],

  progressionRules: [
  {
    id: 'ach-rule-1',
    condition: 'Pain remains below 2/10 for 3 consecutive days',
    action: 'Increase load by 5% (add weighted pack)'
  },
  {
    id: 'ach-rule-2',
    condition: 'Pain score ≥ 4/10 on any session',
    action: 'Pause escalation and reduce load by 20% the next day'
  }],

  contraindications: [
  { id: 'ach-c-1', text: 'Stop immediately if acute pain exceeds 3/10.', severity: 'stop' },
  {
    id: 'ach-c-2',
    text: 'Skip the session if morning stiffness persists beyond 60 minutes.',
    severity: 'caution'
  }],

  missingDataFlags: [
  {
    stepId: 'ach-3',
    parameter: 'Hold duration for Static Calf Stretch',
    fallback: 'Conservative baseline: 3 × 30s hold'
  }],

  dayHistory: [1, 0.67, 1],
  initialSetsDone: { 'ach-1': 3, 'ach-2': 3, 'ach-3': 0 },
  feedbackMetric: {
    name: 'pain',
    label: 'tendon pain',
    eyebrow: 'pain',
    logTitle: 'log',
    minLabel: '0 · none',
    maxLabel: '10 · severe',
    maxScore: 10,
    escalationThreshold: 4,
    escalationMessage: 'Tendon pain threshold exceeded (≥ 4/10). Escalation paused. Recommendation: Reduce load by 20% tomorrow or consult your therapist.'
  },
  initialPainLogs: [
  { id: 'ach-pain-1', day: 1, score: 3, note: 'Tender at first drop.', loggedAt: 'Sat' },
  { id: 'ach-pain-2', day: 2, score: 2, note: '', loggedAt: 'Sun' },
  { id: 'ach-pain-3', day: 3, score: 1, note: 'Much easier today.', loggedAt: 'Mon' }],

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
  { id: 'ach-msg-3', role: 'ai', kind: 'protocol', content: 'achilles', timestamp: '9:03 AM' }],

  community: {
    studyEfficacy: 80,
    realWorldEfficacy: 74,
    userCount: 1240,
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
      handle: 'Anonymous · 41M · Runner',
      day: 5,
      outcome: 'adjusted',
      text: 'Scaled load down by 10% on Day 5 due to soreness, recovered fully by Week 3.',
      adherence: 88
    },
    {
      id: 'ach-rev-2',
      handle: 'Anonymous · 33F · Desk worker',
      day: 11,
      outcome: 'paused',
      text: 'Day 11 escalation was too aggressive. Paused two days, then repeated Week 1 loading before progressing.',
      adherence: 61
    },
    {
      id: 'ach-rev-3',
      handle: 'Anonymous · 29M · Basketball',
      day: 14,
      outcome: 'improved',
      text: 'Finished Phase 1 at 0/10 pain. Morning stiffness dropped from 25 min to under 5 min.',
      adherence: 96
    },
    {
      id: 'ach-rev-4',
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
    question: 'is some pain okay?',
    keywords: ['pain', 'hurt', 'sore', 'ache'],
    answer:
    'Yes — mild discomfort during loading was allowed. The stop rule is acute pain above 3/10. Past that, stop the session and log it so escalation pauses.'
  },
  {
    question: 'when do I add load?',
    keywords: ['progress', 'increase', 'load', 'weight', 'heavier', 'backpack'],
    answer:
    'Per the progression rule: once pain stays below 2/10 for 3 consecutive days, add 5% load using a weighted backpack.'
  },
  {
    question: 'why is the stretch defaulted?',
    keywords: ['stretch', 'hold', 'missing', 'default'],
    answer:
    'The authors only wrote "participants stretched the calf" with no hold time. Instead of guessing, I flagged it and applied a conservative 3 × 30s hold.'
  }]

};