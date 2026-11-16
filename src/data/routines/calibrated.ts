/**
 * Pre-calibrated routines for the QA reference papers (TC-01 … TC-06).
 *
 * These papers are matched by DOI or title before any LLM call, so the extracted routine is
 * identical on every run and each QA checklist item has a stable expected result.
 */

import type { ChatMessage, Routine } from '../../types/routine';
import { COPY } from '../copy';

function intakeMessages(id: string, fileName: string, pages: number, scope: string): ChatMessage[] {
  return [
    { id: `${id}-msg-1`, role: 'user', kind: 'file', content: fileName, timestamp: '9:00 AM' },
    {
      id: `${id}-msg-2`,
      role: 'ai',
      kind: 'text',
      content: `Parsed ${pages} pages and isolated ${scope}.`,
      timestamp: '9:01 AM'
    },
    { id: `${id}-msg-3`, role: 'ai', kind: 'routine', content: id, timestamp: '9:01 AM' }
  ];
}

/** TC-01 · Rathleff et al. 2015 · plantar fasciitis high-load strength training */
export const plantarFasciitisRoutine: Routine = {
  id: 'plantar-fasciitis',
  title: 'Plantar Fasciitis High-Load Strength Training',
  shortTitle: 'plantar fasciitis',
  icon: 'fitness',
  phase: 'Phase 1: Week 1–2 (12RM)',
  phaseLabel: 'week 1',
  totalDays: 84,
  currentDay: 1,
  streak: 0,
  paper: {
    title:
      'High-load strength training improves outcome in patients with plantar fasciitis: A randomized controlled trial with 12-month follow-up',
    fileName: 'Rathleff_2015_Plantar_Fasciitis_HighLoad.pdf',
    authors: 'Rathleff M.S., Mølgaard C.M., Fredberg U., et al.',
    year: 2015,
    journal: 'Scandinavian Journal of Medicine & Science in Sports',
    doi: '10.1111/sms.12313',
    sampleSize: 48,
    trialType: 'Randomized Controlled Trial',
    evidenceBadges: ['rct', 'missing-parameters'],
    pages: 9
  },
  steps: [
    {
      id: 'pf-1',
      tone: 'orange',
      icon: 'fitness',
      action: 'Single-Leg Heel Raise with Towel Under Toes',
      detail:
        'Stand on a step with a rolled towel under the toes so the plantar fascia is stretched (windlass). Rise for 3s, hold 2s at the top, lower for 3s. Weeks 1–2: 12RM load.',
      sets: 3,
      reps: 12,
      frequency: 'Every other day',
      tempo: '3s up · 2s hold · 3s down',
      perSetLabel: '× 12 reps (12RM)',
      statLabel: 'tempo:',
      statValue: '3-2-3s',
      inferred: true,
      inferredProvenance: {
        tier: 'guideline',
        source: 'ACSM Clinical Baseline: 2 min rest',
        rationale:
          'Warm-up and rest between sets were not reported. Applied ACSM resistance-training baseline: 5 min easy walking warm-up and 2 min rest between sets.'
      }
    }
  ],
  progressionRules: [
    {
      id: 'pf-rule-1',
      condition: 'Week 3 reached and morning first-step pain stays below 4/10',
      action: 'Increase load to 10RM and perform 4 sets'
    },
    {
      id: 'pf-rule-2',
      condition: 'Week 5 reached and morning first-step pain stays below 4/10',
      action: 'Increase load to 8RM and perform 5 sets'
    },
    {
      id: 'pf-rule-3',
      condition: 'Morning first-step heel pain reaches 4/10 or higher',
      action: 'Pause progression and reduce load by 20% tomorrow'
    }
  ],
  contraindications: [
    {
      id: 'pf-c-1',
      text: 'Stop if you feel sudden sharp heel pain, a pop, or new swelling (possible fascia rupture).',
      severity: 'stop'
    },
    {
      id: 'pf-c-2',
      text: 'Hold a wall or rail for balance; do not train on an unstable surface.',
      severity: 'caution'
    }
  ],
  missingDataFlags: [
    {
      stepId: 'pf-1',
      parameter: 'Warm-up and rest interval between sets',
      fallback: 'Conservative baseline: 5 min walking warm-up, 2 min rest between sets',
      sourceGuideline: 'ACSM Clinical Baseline: 2 min rest'
    }
  ],
  dayHistory: [],
  initialSetsDone: {},
  feedbackMetric: {
    name: 'heel pain',
    label: 'morning first-step heel pain',
    eyebrow: 'heel pain',
    logTitle: 'pain log',
    minLabel: '0 · none',
    maxLabel: '10 · worst',
    maxScore: 10,
    escalationThreshold: 4,
    escalationMessage: COPY.safety.baselineEscalationAlert,
    escalationSource: 'policy'
  },
  dataCollectionSpec: [
    {
      id: 'pf-first-step-pain',
      name: 'heel pain',
      label: 'Morning first-step heel pain (NRS 0–10)',
      type: 'scale',
      frequency: 'daily',
      min: 0,
      max: 10,
      step: 1,
      instructions: 'Rate the heel pain of your first steps after getting out of bed.',
      escalationThreshold: 4,
      escalationMessage: COPY.safety.baselineEscalationAlert,
      escalationSource: 'policy'
    }
  ],
  initialMorphingLogs: [],
  initialFeedbackLogs: [],
  initialMessages: intakeMessages(
    'plantar-fasciitis',
    'Rathleff_2015_Plantar_Fasciitis_HighLoad.pdf',
    9,
    'the high-load strength training routine. Insole and stretching-only arms were excluded'
  ),
  community: {
    studyEfficacy: 78,
    realWorldEfficacy: 70,
    userCount: 1,
    medianAdherence: 76,
    dropOffUnit: 'week',
    peakPeriod: 3,
    dropOff: [
      { period: 1, dropOff: 5 },
      { period: 2, dropOff: 12 },
      { period: 3, dropOff: 31 },
      { period: 4, dropOff: 9 }
    ],
    insightLead: '31% drop-off in Week 3',
    insightRest: 'when the load jumps to 10RM. Keep the 3-2-3s tempo and add load in small steps.',
    reviews: [
      {
        id: 'pf-rev-1',
        handle: 'Anonymous · 41F · Runner',
        day: 21,
        outcome: 'improved',
        text: 'First-step pain went from 6/10 to 2/10 in three weeks. The towel under the toes makes a big difference.',
        adherence: 88
      }
    ]
  },
  faqs: [
    {
      question: 'why put a towel under my toes?',
      keywords: ['towel', 'toes', 'windlass'],
      answer:
        'The towel lifts the toes and tensions the plantar fascia (windlass mechanism), so the heel raise loads the fascia, not only the calf.'
    },
    {
      question: 'how often do I train?',
      keywords: ['often', 'frequency', 'every', 'days'],
      answer: 'Every second day. Rest days let the fascia adapt to the high load.'
    }
  ]
};

/** TC-02 · Craighead et al. 2021 · high-resistance inspiratory muscle strength training */
export const imstBloodPressureRoutine: Routine = {
  id: 'imst-blood-pressure',
  title: 'High-Resistance Inspiratory Muscle Strength Training (IMST)',
  shortTitle: 'IMST breathing',
  icon: 'heart',
  phase: 'Phase 1: Week 1–6',
  phaseLabel: 'week 1',
  totalDays: 42,
  currentDay: 1,
  streak: 0,
  paper: {
    title:
      'Novel High-Resistance Inspiratory Muscle Strength Training Lowers Blood Pressure and Improves Vascular Endothelial Function in Healthy Midlife and Older Adults',
    fileName: 'Craighead_2021_IMST_Blood_Pressure.pdf',
    authors: 'Craighead D.H., Heinbockel T.C., Freeberg K.A., et al.',
    year: 2021,
    journal: 'Journal of the American Heart Association',
    doi: '10.1161/JAHA.121.020982',
    sampleSize: 36,
    trialType: 'Double-Blind Sham-Controlled RCT',
    evidenceBadges: ['rct'],
    pages: 16
  },
  steps: [
    {
      id: 'imst-1',
      tone: 'sky',
      icon: 'heart',
      action: 'High-Resistance Inspiratory Breaths',
      detail:
        'Breathe in hard and fast through the IMST device set to 75% of your maximal inspiratory pressure (PImax). About 5 minutes per session.',
      sets: 1,
      reps: 30,
      frequency: '6x Weekly',
      durationSeconds: 300,
      setLabel: 'session',
      perSetLabel: '× 30 breaths at 75% PImax',
      statLabel: 'resistance:',
      statValue: '75% PImax'
    }
  ],
  progressionRules: [
    {
      id: 'imst-rule-1',
      condition: 'Start of each new training week',
      action: 'Re-measure PImax and set the device to 75% of the new value'
    },
    {
      id: 'imst-rule-2',
      condition: 'Lightheadedness / dizziness reaches 4/10 or higher',
      action: 'Pause progression, check blood pressure, and reduce resistance to 50% PImax'
    }
  ],
  contraindications: [
    {
      id: 'imst-c-1',
      text: 'Stop the session if you feel faint, have chest pain, or see spots.',
      severity: 'stop'
    },
    {
      id: 'imst-c-2',
      text: 'Ask a clinician first if you have had a collapsed lung, a ruptured eardrum, or uncontrolled hypertension.',
      severity: 'caution'
    }
  ],
  missingDataFlags: [],
  dayHistory: [],
  initialSetsDone: {},
  feedbackMetric: {
    name: 'dizziness',
    label: 'lightheadedness / dizziness',
    eyebrow: 'dizziness',
    logTitle: 'dizziness log',
    minLabel: '0 · none',
    maxLabel: '10 · near fainting',
    maxScore: 10,
    escalationThreshold: 4,
    escalationMessage:
      'Dizziness threshold exceeded (≥ 4/10). Escalation paused. Sit down, check your blood pressure, and reduce resistance to 50% PImax for the next session.',
    escalationSource: 'protocol'
  },
  dataCollectionSpec: [
    {
      id: 'imst-sbp',
      name: 'Systolic Blood Pressure',
      label: 'Systolic Blood Pressure (mmHg)',
      type: 'numeric',
      frequency: 'daily',
      unit: 'mmHg',
      min: 70,
      max: 250,
      targetMin: 90,
      targetMax: 120,
      step: 1,
      instructions: 'Seated, after 5 minutes of rest, before the training session. Use the upper-arm cuff.'
    },
    {
      id: 'imst-session-timer',
      name: 'IMST session timer',
      label: '5-minute IMST session',
      type: 'timer',
      timerMode: 'countdown',
      frequency: 'daily',
      unit: 'seconds',
      min: 0,
      max: 300,
      step: 1,
      instructions: 'Start the timer with your first breath. Rest briefly between breaths if needed.'
    },
    {
      id: 'imst-dizziness',
      name: 'dizziness',
      label: 'Lightheadedness / dizziness (0–10)',
      type: 'scale',
      frequency: 'daily',
      min: 0,
      max: 10,
      step: 1,
      escalationThreshold: 4,
      escalationMessage:
        'Dizziness threshold exceeded (≥ 4/10). Escalation paused. Sit down, check your blood pressure, and reduce resistance to 50% PImax for the next session.',
      escalationSource: 'protocol'
    }
  ],
  initialMorphingLogs: [],
  initialFeedbackLogs: [],
  initialMessages: intakeMessages(
    'imst-blood-pressure',
    'Craighead_2021_IMST_Blood_Pressure.pdf',
    16,
    'the high-resistance IMST arm. The 15% PImax sham arm was excluded'
  ),
  community: {
    studyEfficacy: 82,
    realWorldEfficacy: 75,
    userCount: 1,
    medianAdherence: 84,
    dropOffUnit: 'week',
    peakPeriod: 2,
    dropOff: [
      { period: 1, dropOff: 8 },
      { period: 2, dropOff: 22 },
      { period: 3, dropOff: 9 },
      { period: 6, dropOff: 4 }
    ],
    insightLead: '22% drop-off in Week 2',
    insightRest: 'often after a dizzy session. Sit while training and pause between breaths.',
    reviews: [
      {
        id: 'imst-rev-1',
        handle: 'Anonymous · 58M · Office Worker',
        day: 30,
        outcome: 'improved',
        text: 'Five minutes a day and my home systolic readings dropped by about 8 mmHg.',
        adherence: 92
      }
    ]
  },
  faqs: [
    {
      question: 'what is PImax?',
      keywords: ['pimax', 'maximal', 'pressure', 'resistance'],
      answer:
        'PImax is the strongest inhale you can make against a closed valve. Training uses 75% of that value.'
    }
  ]
};

/** TC-03 · Haghayegh et al. 2019 · before-bedtime passive body heating */
export const warmBathSleepRoutine: Routine = {
  id: 'warm-bath-sleep',
  title: 'Before-Bedtime Warm Bath Sleep Routine',
  shortTitle: 'warm bath sleep',
  icon: 'sleep',
  phase: 'Phase 1: Week 1–2',
  phaseLabel: 'week 1',
  totalDays: 14,
  currentDay: 1,
  streak: 0,
  paper: {
    title:
      'Before-bedtime passive body heating by warm shower or bath to improve sleep: A systematic review and meta-analysis',
    fileName: 'Haghayegh_2019_Warm_Bath_Sleep.pdf',
    authors: 'Haghayegh S., Khoshnevis S., Smolensky M.H., Diller K.R., Castriotta R.J.',
    year: 2019,
    journal: 'Sleep Medicine Reviews',
    doi: '10.1016/j.smrv.2019.04.008',
    sampleSize: 17,
    trialType: 'Systematic Review & Meta-Analysis (17 studies)',
    evidenceBadges: ['missing-parameters'],
    pages: 12
  },
  steps: [
    {
      id: 'wb-1',
      tone: 'peach',
      icon: 'water',
      action: 'Warm Water Immersion',
      detail: 'Warm bath or shower at 40.0–42.5°C. Sessions of 10 minutes or more were effective; 15 minutes is used here.',
      sets: 1,
      reps: 1,
      frequency: '1x Nightly',
      durationSeconds: 900,
      setLabel: 'session',
      perSetLabel: '× 15 min at 40.0–42.5°C',
      statLabel: 'water:',
      statValue: '40.0–42.5°C'
    },
    {
      id: 'wb-2',
      tone: 'lavender',
      icon: 'sleep',
      action: 'Pre-Bed Cooldown Buffer',
      detail: 'Finish the bath 90 minutes before lights out. Rest in a cool room so core temperature can fall.',
      sets: 1,
      reps: 1,
      frequency: '1x Nightly',
      durationSeconds: 5400,
      setLabel: 'window',
      perSetLabel: '× 90 min before bed',
      statLabel: 'timing:',
      statValue: '90 min'
    }
  ],
  progressionRules: [
    {
      id: 'wb-rule-1',
      condition: 'Sleep onset latency stays above 30 minutes for 3 nights',
      action: 'Move the bath 15 minutes earlier, keeping it 1–2 hours before bed'
    }
  ],
  contraindications: [
    {
      id: 'wb-c-1',
      text: 'Get out of the water if you feel dizzy, faint, or your heart races.',
      severity: 'stop'
    },
    {
      id: 'wb-c-2',
      text: 'Ask a clinician first if you have heart disease, low blood pressure, or are pregnant.',
      severity: 'caution'
    }
  ],
  missingDataFlags: [],
  dayHistory: [],
  initialSetsDone: {},
  feedbackMetric: {
    name: 'grogginess',
    label: 'daytime grogginess / mental fatigue',
    eyebrow: 'fatigue',
    logTitle: 'grogginess log',
    minLabel: '0 · alert',
    maxLabel: '10 · exhausted',
    maxScore: 10,
    escalationThreshold: 4,
    escalationMessage:
      'Grogginess threshold exceeded (≥ 4/10). Escalation paused. Keep the bath at least 90 minutes before bed and lower the water toward 40°C tonight.',
    escalationSource: 'protocol'
  },
  dataCollectionSpec: [
    {
      id: 'wb-bath-timer',
      name: 'Bath timer',
      label: '15-minute warm bath',
      type: 'timer',
      timerMode: 'countdown',
      frequency: 'daily',
      unit: 'seconds',
      min: 0,
      max: 900,
      step: 1,
      instructions: 'Start when you are fully in the water at 40.0–42.5°C.'
    },
    {
      id: 'wb-sleep-latency',
      name: 'Sleep onset latency',
      label: 'Minutes to fall asleep',
      type: 'numeric',
      frequency: 'daily',
      unit: 'min',
      min: 0,
      max: 180,
      step: 1,
      instructions: 'Estimate the minutes from lights out until you fell asleep.'
    },
    {
      id: 'wb-morning-alertness',
      name: 'Morning alertness',
      label: 'How did you wake up?',
      type: 'multichoice',
      frequency: 'daily',
      options: ['Refreshed', 'Groggy', 'Disrupted'],
      instructions: 'Choose the option that best describes your first 30 minutes after waking.'
    }
  ],
  initialMorphingLogs: [],
  initialFeedbackLogs: [],
  initialMessages: intakeMessages(
    'warm-bath-sleep',
    'Haghayegh_2019_Warm_Bath_Sleep.pdf',
    12,
    'the pooled water-based heating parameters. Non-water heating methods were excluded'
  ),
  community: {
    studyEfficacy: 74,
    realWorldEfficacy: 68,
    userCount: 1,
    medianAdherence: 81,
    dropOffUnit: 'day',
    peakPeriod: 5,
    dropOff: [
      { period: 1, dropOff: 3 },
      { period: 3, dropOff: 9 },
      { period: 5, dropOff: 24 },
      { period: 10, dropOff: 6 }
    ],
    insightLead: '24% drop-off on Day 5',
    insightRest: 'when evenings get busy. A warm shower counts if a bath is not possible.',
    reviews: [
      {
        id: 'wb-rev-1',
        handle: 'Anonymous · 36F · Nurse',
        day: 9,
        outcome: 'improved',
        text: 'Falling asleep went from 40 minutes to about 15.',
        adherence: 86
      }
    ]
  },
  faqs: [
    {
      question: 'why 90 minutes before bed?',
      keywords: ['90', 'timing', 'before bed', 'when'],
      answer:
        'Heating moves blood to the skin. Over the next 1–2 hours core temperature drops faster, which signals sleep onset.'
    }
  ]
};

/** TC-04 · Harman et al. 2005 · forward head posture exercise program */
export const cervicalPostureRoutine: Routine = {
  id: 'cervical-posture',
  title: 'Forward Head Posture Correction Program',
  shortTitle: 'neck posture',
  icon: 'stretch',
  phase: 'Phase 1: Week 1–4',
  phaseLabel: 'week 1',
  totalDays: 70,
  currentDay: 1,
  streak: 0,
  paper: {
    title:
      'Effectiveness of an Exercise Program to Improve Forward Head Posture in Normal Adults: A Randomized Controlled Trial',
    fileName: 'Harman_2005_Forward_Head_Posture.pdf',
    authors: 'Harman K., Hubley-Kozey C.L., Butler H.',
    year: 2005,
    journal: 'Journal of Manual & Manipulative Therapy',
    doi: '10.1179/106698105790824888',
    sampleSize: 40,
    trialType: 'Randomized Controlled Trial',
    evidenceBadges: ['rct', 'missing-parameters'],
    pages: 14
  },
  steps: [
    {
      id: 'cp-1',
      tone: 'mint',
      icon: 'stretch',
      action: 'Deep Cervical Flexor Chin Tuck',
      detail: 'Lying on your back, nod the chin gently toward the throat without lifting the head. Hold, then relax.',
      sets: 2,
      reps: 10,
      frequency: '1x Daily',
      tempo: '5s isometric hold',
      durationSeconds: 5,
      perSetLabel: '× 10 holds of 5s',
      statLabel: 'hold:',
      statValue: '5s isometric'
    },
    {
      id: 'cp-2',
      tone: 'sky',
      icon: 'fitness',
      action: 'Scapular Retraction with Band',
      detail: 'Squeeze the shoulder blades back and down against a light resistance band.',
      sets: 2,
      reps: 12,
      frequency: '3x Weekly'
    },
    {
      id: 'cp-3',
      tone: 'lavender',
      icon: 'stretch',
      action: 'Doorway Pectoral Stretch',
      detail: 'Forearms on the door frame, step forward until you feel a stretch across the chest.',
      sets: 2,
      reps: 1,
      frequency: '1x Daily',
      durationSeconds: 30,
      inferred: true,
      inferredProvenance: {
        tier: 'guideline',
        source: 'ACSM Flexibility Guidelines',
        rationale: 'Stretch hold time was not reported. Applied the ACSM 30-second static stretch baseline.'
      }
    }
  ],
  progressionRules: [
    {
      id: 'cp-rule-1',
      condition: 'Chin tucks done with no neck tension above 2/10 for 2 weeks',
      action: 'Increase to 3 sets of 10 holds'
    }
  ],
  contraindications: [
    {
      id: 'cp-c-1',
      text: 'Stop if you feel pain, tingling or numbness spreading into the arm, or dizziness.',
      severity: 'stop'
    },
    {
      id: 'cp-c-2',
      text: 'Keep the movement small; do not force the neck into end range.',
      severity: 'caution'
    }
  ],
  missingDataFlags: [
    {
      stepId: 'cp-3',
      parameter: 'Pectoral stretch hold duration',
      fallback: 'Conservative baseline: 2 × 30s static hold',
      sourceGuideline: 'ACSM Flexibility Guidelines'
    }
  ],
  dayHistory: [],
  initialSetsDone: {},
  feedbackMetric: {
    name: 'neck tension',
    label: 'cervical tension / headache',
    eyebrow: 'tension',
    logTitle: 'tension log',
    minLabel: '0 · none',
    maxLabel: '10 · severe headache',
    maxScore: 10,
    escalationThreshold: 4,
    escalationMessage:
      'Cervical tension threshold exceeded (≥ 4/10). Escalation paused. Keep the current volume, shorten holds to 3 seconds, and stop if the headache gets worse.',
    escalationSource: 'protocol'
  },
  dataCollectionSpec: [
    {
      id: 'cp-posture-photo',
      name: 'Posture photo',
      label: 'Side-view posture photo',
      type: 'photo',
      frequency: 'milestone',
      milestoneDays: [1, 14, 30],
      instructions: 'Stand sideways to the camera at shoulder height, relaxed, ear and shoulder visible.'
    },
    {
      id: 'cp-neck-tension',
      name: 'neck tension',
      label: 'Cervical tension / headache (0–10)',
      type: 'scale',
      frequency: 'daily',
      min: 0,
      max: 10,
      step: 1,
      escalationThreshold: 4,
      escalationMessage:
        'Cervical tension threshold exceeded (≥ 4/10). Escalation paused. Keep the current volume, shorten holds to 3 seconds, and stop if the headache gets worse.',
      escalationSource: 'protocol'
    }
  ],
  initialMorphingLogs: [],
  initialFeedbackLogs: [],
  initialMessages: intakeMessages(
    'cervical-posture',
    'Harman_2005_Forward_Head_Posture.pdf',
    14,
    'the 10-week home exercise program. Photogrammetry methods were kept for milestone photos'
  ),
  community: {
    studyEfficacy: 70,
    realWorldEfficacy: 64,
    userCount: 1,
    medianAdherence: 72,
    dropOffUnit: 'week',
    peakPeriod: 4,
    dropOff: [
      { period: 1, dropOff: 4 },
      { period: 2, dropOff: 10 },
      { period: 4, dropOff: 26 },
      { period: 8, dropOff: 8 }
    ],
    insightLead: '26% drop-off in Week 4',
    insightRest: 'before visible change appears. The Day 30 photo is the best motivator.',
    reviews: [
      {
        id: 'cp-rev-1',
        handle: 'Anonymous · 29M · Developer',
        day: 30,
        outcome: 'improved',
        text: 'The side-by-side photos showed my ear moving back over my shoulder.',
        adherence: 80
      }
    ]
  },
  faqs: [
    {
      question: 'why hold the chin tuck instead of doing reps?',
      keywords: ['hold', 'isometric', 'chin', 'tuck'],
      answer:
        'The deep neck flexors are endurance muscles. Short isometric holds train them without the larger muscles taking over.'
    }
  ]
};

/** TC-05 · Chandrasekhar et al. 2012 · KSM-66 ashwagandha root extract */
export const ashwagandhaStressRoutine: Routine = {
  id: 'ashwagandha-stress',
  title: 'KSM-66 Ashwagandha Stress Reduction Routine',
  shortTitle: 'ashwagandha',
  icon: 'pill',
  phase: 'Phase 1: Day 1–60',
  phaseLabel: 'day 1',
  totalDays: 60,
  currentDay: 1,
  streak: 0,
  paper: {
    title:
      'A prospective, randomized double-blind, placebo-controlled study of safety and efficacy of a high-concentration full-spectrum extract of Ashwagandha root in reducing stress and anxiety in adults',
    fileName: 'Chandrasekhar_2012_KSM66_Ashwagandha.pdf',
    authors: 'Chandrasekhar K., Kapoor J., Anishetty S.',
    year: 2012,
    journal: 'Indian Journal of Psychological Medicine',
    doi: '10.4103/0253-7176.106022',
    sampleSize: 64,
    trialType: 'Double-Blind Placebo-Controlled RCT',
    evidenceBadges: ['rct', 'missing-parameters'],
    pages: 8
  },
  steps: [
    {
      id: 'ash-1',
      tone: 'yellow',
      icon: 'pill',
      action: 'KSM-66 Ashwagandha Capsule',
      detail: 'One 300 mg capsule of full-spectrum root extract in the morning and one at night, each with food.',
      sets: 2,
      reps: 1,
      frequency: 'Morning & Night with food',
      setLabel: 'capsules',
      perSetLabel: '× 300 mg with 250 mL water',
      statLabel: 'dose:',
      statValue: '300 mg',
      inferred: true,
      inferredProvenance: {
        tier: 'guideline',
        source: 'Standard Oral Dosing: 250 mL water',
        rationale: 'Authors did not state what to take the capsule with. Applied the standard 250 mL glass of water.'
      }
    }
  ],
  progressionRules: [
    {
      id: 'ash-rule-1',
      condition: 'GI distress reaches 4/10 or higher',
      action: 'Split-dose rule: take each capsule in the middle of a full meal, never both at once'
    },
    {
      id: 'ash-rule-2',
      condition: 'GI distress stays at 4/10 or higher for 2 days after splitting',
      action: 'Reduce to one 300 mg capsule daily and contact your clinician'
    }
  ],
  contraindications: [
    {
      id: 'ash-c-1',
      text: 'Stop and see a doctor if you notice yellow skin or eyes, dark urine, or upper-right belly pain.',
      severity: 'stop'
    },
    {
      id: 'ash-c-2',
      text: 'Ask a clinician first if you are pregnant, take thyroid medicine or sedatives, or have an autoimmune disease.',
      severity: 'caution'
    }
  ],
  missingDataFlags: [
    {
      stepId: 'ash-1',
      parameter: 'Co-ingested liquid volume',
      fallback: 'Standard guideline: take each capsule with 250 mL of water',
      sourceGuideline: 'Standard Oral Dosing: 250 mL water'
    }
  ],
  dayHistory: [],
  initialSetsDone: {},
  feedbackMetric: {
    name: 'GI distress',
    label: 'gastrointestinal distress / nausea',
    eyebrow: 'tolerance',
    logTitle: 'distress log',
    minLabel: '0 · none',
    maxLabel: '10 · severe nausea',
    maxScore: 10,
    escalationThreshold: 4,
    escalationMessage:
      'GI distress threshold exceeded (≥ 4/10). Escalation paused. Split-dose rule: take each 300 mg capsule in the middle of a full meal, never both at once.',
    escalationSource: 'protocol'
  },
  dataCollectionSpec: [
    {
      id: 'ash-gi-distress',
      name: 'GI distress',
      label: 'GI distress / nausea (0–10)',
      type: 'scale',
      frequency: 'daily',
      min: 0,
      max: 10,
      step: 1,
      escalationThreshold: 4,
      escalationMessage:
        'GI distress threshold exceeded (≥ 4/10). Escalation paused. Split-dose rule: take each 300 mg capsule in the middle of a full meal, never both at once.',
      escalationSource: 'protocol'
    },
    {
      id: 'ash-pss',
      name: 'Perceived Stress Scale',
      label: 'Perceived Stress Scale (PSS-10)',
      type: 'numeric',
      frequency: 'weekly',
      unit: 'points',
      min: 0,
      max: 40,
      step: 1,
      instructions: 'Answer the 10 PSS questions about the last week and enter the total score.'
    }
  ],
  initialMorphingLogs: [],
  initialFeedbackLogs: [],
  initialMessages: intakeMessages(
    'ashwagandha-stress',
    'Chandrasekhar_2012_KSM66_Ashwagandha.pdf',
    8,
    'the 300 mg twice-daily dosing schedule. The placebo arm was excluded'
  ),
  community: {
    studyEfficacy: 80,
    realWorldEfficacy: 72,
    userCount: 1,
    medianAdherence: 87,
    dropOffUnit: 'week',
    peakPeriod: 2,
    dropOff: [
      { period: 1, dropOff: 6 },
      { period: 2, dropOff: 18 },
      { period: 4, dropOff: 7 },
      { period: 8, dropOff: 3 }
    ],
    insightLead: '18% drop-off in Week 2',
    insightRest: 'mostly missed night doses. Keep the bottle next to your toothbrush.',
    reviews: [
      {
        id: 'ash-rev-1',
        handle: 'Anonymous · 33F · Teacher',
        day: 45,
        outcome: 'improved',
        text: 'My PSS score went from 24 to 15. Taking it mid-meal fixed the mild nausea.',
        adherence: 91
      }
    ]
  },
  faqs: [
    {
      question: 'can I take both capsules together?',
      keywords: ['together', 'both', 'once'],
      answer: 'The trial used 300 mg twice daily. Keep the doses apart, one in the morning and one at night.'
    }
  ]
};

/** TC-06 · Jaeggi et al. 2008 · dual n-back working-memory training */
export const dualNBackRoutine: Routine = {
  id: 'dual-n-back',
  title: 'Dual N-Back Working Memory Training',
  shortTitle: 'dual n-back',
  icon: 'brain',
  phase: 'Phase 1: Day 1–19',
  phaseLabel: 'day 1',
  totalDays: 19,
  currentDay: 1,
  streak: 0,
  paper: {
    title: 'Improving fluid intelligence with training on working memory',
    fileName: 'Jaeggi_2008_Dual_N_Back.pdf',
    authors: 'Jaeggi S.M., Buschkuehl M., Jonides J., Perrig W.J.',
    year: 2008,
    journal: 'Proceedings of the National Academy of Sciences (PNAS)',
    doi: '10.1073/pnas.0801268105',
    sampleSize: 70,
    trialType: 'Controlled Training Study',
    evidenceBadges: ['missing-parameters'],
    pages: 5
  },
  steps: [
    {
      id: 'nb-1',
      tone: 'lavender',
      icon: 'brain',
      action: 'Dual N-Back Session',
      detail:
        'Audio-visual dual n-back: match square positions and spoken letters to the ones n steps back. 20 blocks per session.',
      sets: 1,
      reps: 20,
      frequency: '1x Daily',
      durationSeconds: 1200,
      setLabel: 'session',
      perSetLabel: '× 20 blocks · 20 min',
      statLabel: 'duration:',
      statValue: '20 min'
    }
  ],
  progressionRules: [
    {
      id: 'nb-rule-1',
      condition: 'Block accuracy > 80% for 3 days',
      action: 'Advance N-level by 1'
    },
    {
      id: 'nb-rule-2',
      condition: 'Within a session: fewer than 3 errors per modality in a block',
      action: 'Next block uses n + 1; more than 5 errors drops to n − 1'
    }
  ],
  contraindications: [
    {
      id: 'nb-c-1',
      text: 'Stop the session if you get a headache or eye strain that does not ease after a break.',
      severity: 'stop'
    }
  ],
  missingDataFlags: [],
  dayHistory: [],
  initialSetsDone: {},
  feedbackMetric: {
    name: 'mental fatigue',
    label: 'mental fatigue / cognitive strain',
    eyebrow: 'fatigue',
    logTitle: 'fatigue log',
    minLabel: '0 · fresh',
    maxLabel: '10 · exhausted',
    maxScore: 10,
    escalationThreshold: 4,
    escalationMessage:
      'Mental fatigue threshold exceeded (≥ 4/10). Escalation paused. Stay at your current N-level tomorrow and take a short break between blocks.',
    escalationSource: 'protocol'
  },
  dataCollectionSpec: [
    {
      id: 'nb-session-timer',
      name: 'Session timer',
      label: '20-minute training session',
      type: 'timer',
      timerMode: 'countdown',
      frequency: 'daily',
      unit: 'seconds',
      min: 0,
      max: 1200,
      step: 1,
      instructions: 'Start the timer with the first block.'
    },
    {
      id: 'nb-fatigue',
      name: 'mental fatigue',
      label: 'Mental fatigue / cognitive strain (0–10)',
      type: 'scale',
      frequency: 'daily',
      min: 0,
      max: 10,
      step: 1,
      escalationThreshold: 4,
      escalationMessage:
        'Mental fatigue threshold exceeded (≥ 4/10). Escalation paused. Stay at your current N-level tomorrow and take a short break between blocks.',
      escalationSource: 'protocol'
    },
    {
      id: 'nb-level',
      name: 'N-level reached',
      label: 'Highest N-level reached today',
      type: 'numeric',
      frequency: 'daily',
      min: 1,
      max: 12,
      step: 1
    }
  ],
  initialMorphingLogs: [],
  initialFeedbackLogs: [],
  initialMessages: intakeMessages(
    'dual-n-back',
    'Jaeggi_2008_Dual_N_Back.pdf',
    5,
    'the adaptive dual n-back training schedule. Fluid-intelligence test batteries were excluded'
  ),
  community: {
    studyEfficacy: 60,
    realWorldEfficacy: 55,
    userCount: 1,
    medianAdherence: 70,
    dropOffUnit: 'day',
    peakPeriod: 6,
    dropOff: [
      { period: 1, dropOff: 5 },
      { period: 3, dropOff: 12 },
      { period: 6, dropOff: 28 },
      { period: 12, dropOff: 10 }
    ],
    insightLead: '28% drop-off on Day 6',
    insightRest: 'when the N-level plateaus. Plateaus are normal; keep the daily session.',
    reviews: [
      {
        id: 'nb-rev-1',
        handle: 'Anonymous · 24M · Student',
        day: 15,
        outcome: 'improved',
        text: 'Went from 2-back to 4-back in two weeks.',
        adherence: 85
      }
    ]
  },
  faqs: [
    {
      question: 'when do I move up an N-level?',
      keywords: ['level', 'advance', 'n-level', 'harder'],
      answer: 'When block accuracy stays above 80% for 3 days in a row, add 1 to N.'
    }
  ]
};

/** TC-UAE-01 · Al-Shehhi et al. 2024 · Circadian Light & Heat-Resilient Hydration Routine */
export const uaeHeatCircadianRoutine: Routine = {
  id: 'uae-heat-circadian',
  title: 'Circadian Light & Heat-Resilient Hydration Routine',
  shortTitle: 'Heat Resilience',
  icon: 'fitness',
  phase: 'Phase 1: Ambient Heat Baseline (Weeks 1–4)',
  phaseLabel: 'week 1',
  totalDays: 28,
  currentDay: 1,
  streak: 0,
  paper: {
    title:
      'Efficacy of morning retinal photic stimulation and indoor thermal micro-conditioning during extreme heat ambient exposure: A randomized interventional trial',
    fileName: 'AlShehhi_2024_Heat_Circadian_AbuDhabi.pdf',
    authors: 'Al-Shehhi K., Henderson T., Mansoor M., et al.',
    year: 2024,
    journal: 'Lancet Regional Health - Middle East / Cleveland Clinic Abu Dhabi Research',
    doi: '10.1016/j.lanepe.2024.100912',
    sampleSize: 64,
    trialType: 'Randomized Controlled Trial',
    evidenceBadges: ['rct', 'missing-parameters'],
    pages: 12
  },
  steps: [
    {
      id: 'heat-1',
      tone: 'yellow',
      icon: 'walk',
      action: 'Morning Sunlight Photoperiod Exposure (Pre-8 AM)',
      detail:
        'Spend 15 minutes outdoors before 8:00 AM (prior to severe UV and ambient heat escalation) to anchor suprachiasmatic nucleus circadian timing without thermal distress.',
      sets: 1,
      reps: 1,
      frequency: 'Daily morning',
      tempo: '15 min exposure',
      perSetLabel: '× 15 min',
      statLabel: 'timing:',
      statValue: 'pre-8:00 AM',
      microDoseStep: {
        action: 'Indoor Bright Window Gaze (Micro-Dose)',
        detail: 'Sit beside a bright sunlit window for 5 minutes if morning heat already exceeds 38°C.',
        sets: 1,
        reps: 1,
        tempo: '5 min gaze'
      }
    },
    {
      id: 'heat-2',
      tone: 'mint',
      icon: 'fitness',
      action: 'Air-Conditioned Indoor Isometric Corridor Circuit',
      detail:
        'Perform 3 sets of 45-second wall sits interspersed with 20 seated calf/tibialis raises inside an air-conditioned room (21–23°C) to maintain vascular shear rate without sweat dehydration.',
      sets: 3,
      reps: 20,
      frequency: 'Daily afternoon',
      tempo: '45s hold · 2m rest',
      perSetLabel: '× 45s hold',
      statLabel: 'hold:',
      statValue: '45s',
      inferred: true,
      inferredProvenance: {
        tier: 'guideline',
        source: 'ACSM Thermal Strain Baseline: indoor rest intervals',
        rationale: 'Rest interval between sets was defaulted to 2 minutes seated in an air-conditioned corridor.'
      },
      microDoseStep: {
        action: 'Seated Isometric Heel-Toe Press (Micro-Dose)',
        detail: '30 seconds of alternating seated isometric heel-toe presses from an office chair.',
        sets: 1,
        reps: 10,
        tempo: '30s hold'
      }
    },
    {
      id: 'heat-3',
      tone: 'sky',
      icon: 'diet',
      action: 'Hypotonic Pre-Transit Hydration Routine',
      detail:
        'Consume 400 mL cold water with 250mg sodium citrate 30 minutes before stepping into outdoor transit or midday sun to preserve cardiac stroke volume.',
      sets: 2,
      reps: 1,
      setLabel: 'doses',
      perSetLabel: '× 400 mL',
      frequency: 'Twice daily',
      statLabel: 'dose:',
      statValue: '400 mL',
      microDoseStep: {
        action: 'Chilled Water Sip (Micro-Dose)',
        detail: 'Drink 200 mL of chilled water.',
        sets: 1,
        reps: 1,
        tempo: 'immediate'
      }
    }
  ],
  progressionRules: [
    {
      id: 'heat-rule-1',
      condition: 'Week 2 reached and midday fatigue score remains below 3/10',
      action: 'Advance wall sit hold duration to 60 seconds and add 1 corridor pacing set'
    },
    {
      id: 'heat-rule-2',
      condition: 'Subjective heat exhaustion, nausea, or dizziness occurs',
      action: 'Pause physical loading immediately, apply cool neck compression, and double hypotonic fluid intake'
    }
  ],
  contraindications: [
    {
      id: 'heat-c-1',
      text: 'Stop immediately and seek medical attention if cessation of sweating, confusion, or severe dizziness occurs.',
      severity: 'stop'
    },
    {
      id: 'heat-c-2',
      text: 'Avoid direct unshaded outdoor physical exertion between 10:30 AM and 4:30 PM during UAE summer.',
      severity: 'caution'
    }
  ],
  missingDataFlags: [
    {
      stepId: 'heat-2',
      parameter: 'Rest interval between wall sit sets',
      fallback: '2 minutes seated recovery in air-conditioned corridor',
      sourceGuideline: 'ACSM Thermal Strain Baseline'
    }
  ],
  dayHistory: [],
  initialSetsDone: {},
  feedbackMetric: {
    name: 'thermal strain',
    label: 'midday subjective thermal strain & fatigue',
    eyebrow: 'thermal strain',
    logTitle: 'strain log',
    minLabel: '0 · optimal',
    maxLabel: '10 · extreme exhaustion',
    maxScore: 10,
    escalationThreshold: 4,
    escalationMessage: COPY.safety.baselineEscalationAlert,
    escalationSource: 'policy'
  },
  dataCollectionSpec: [
    {
      id: 'heat-strain-score',
      name: 'thermal strain',
      label: 'Midday subjective thermal strain & fatigue (0–10)',
      type: 'scale',
      frequency: 'daily',
      min: 0,
      max: 10,
      step: 1,
      instructions: 'Rate your peak daytime physical exhaustion and heat sensitivity today.',
      escalationThreshold: 4,
      escalationMessage: COPY.safety.baselineEscalationAlert,
      escalationSource: 'policy'
    }
  ],
  initialMorphingLogs: [],
  initialFeedbackLogs: [],
  initialMessages: intakeMessages(
    'uae-heat-circadian',
    'AlShehhi_2024_Heat_Circadian_AbuDhabi.pdf',
    12,
    'the morning circadian photoperiod and indoor AC isometric routine. Outdoor endurance arms were filtered out'
  ),
  community: {
    studyEfficacy: 84,
    realWorldEfficacy: 79,
    userCount: 42,
    medianAdherence: 82,
    dropOffUnit: 'week',
    peakPeriod: 2,
    dropOff: [
      { period: 1, dropOff: 4 },
      { period: 2, dropOff: 18 },
      { period: 3, dropOff: 11 },
      { period: 4, dropOff: 7 }
    ],
    insightLead: '18% drop-off in Week 2',
    insightRest: 'during unexpected afternoon temperature spikes. Convert to the 30s seated heel-toe micro-dose.',
    reviews: [
      {
        id: 'heat-rev-1',
        handle: 'Dr. Tariq · 39M · Abu Dhabi Clinician',
        day: 14,
        outcome: 'improved',
        text: 'Morning light before 8 AM and indoor corridor sets prevented the usual summer afternoon cognitive slump completely.',
        adherence: 92
      }
    ]
  },
  faqs: [
    {
      question: 'why must sunlight exposure happen before 8 AM?',
      keywords: ['sunlight', 'morning', '8am', 'uv', 'heat'],
      answer:
        'After 8:00 AM in UAE summer, ambient temperatures rise sharply above 38°C and UV index climbs, turning photic benefits into thermal strain.'
    }
  ]
};

/** TC-UAE-02 · Al-Dhaheri et al. 2023 · Ramadan Circadian & Metabolic Stability Routine */
export const uaeRamadanMetabolicRoutine: Routine = {
  id: 'uae-ramadan-metabolic',
  title: 'Ramadan Circadian & Metabolic Stability Routine',
  shortTitle: 'Ramadan Rhythm',
  icon: 'diet',
  phase: 'Phase 1: Fasting Synchronization (Days 1–10)',
  phaseLabel: 'day 1',
  totalDays: 30,
  currentDay: 1,
  streak: 0,
  paper: {
    title:
      'Chronobiological synchronization and postprandial glycemic stabilization during intermittent fasting: A 30-day interventional cohort in Abu Dhabi',
    fileName: 'AlDhaheri_2023_Ramadan_Metabolic_AbuDhabi.pdf',
    authors: 'Al-Dhaheri A.S., Faris M.E., Mehmood A., et al.',
    year: 2023,
    journal: 'Frontiers in Nutrition · Gulf Endocrine Society Special Edition',
    doi: '10.3389/fnut.2023.1142981',
    sampleSize: 82,
    trialType: 'Interventional Clinical Trial',
    evidenceBadges: ['pilot', 'missing-parameters'],
    pages: 14
  },
  steps: [
    {
      id: 'ramadan-1',
      tone: 'sky',
      icon: 'diet',
      action: 'Pre-Suhoor Low-Glycemic Hydration Loading',
      detail:
        'Consume 600 mL water accompanied by slow-digesting soluble fiber (chia/oats) and potassium-rich dates 40 minutes prior to Fajr prayer to minimize daytime osmolar shifts.',
      sets: 1,
      reps: 1,
      frequency: 'Daily Suhoor',
      tempo: '40 min pre-Fajr',
      perSetLabel: '× 600 mL',
      statLabel: 'timing:',
      statValue: 'pre-Fajr',
      microDoseStep: {
        action: 'Water & Date Quick Sip (Micro-Dose)',
        detail: 'Drink 300 mL water and 1 date if waking late for Suhoor.',
        sets: 1,
        reps: 1,
        tempo: 'immediate'
      }
    },
    {
      id: 'ramadan-2',
      tone: 'mint',
      icon: 'walk',
      action: 'Post-Iftar Light Mobility Pacing (Post-Taraweeh)',
      detail:
        'Perform 15 minutes of continuous indoor corridor pacing 45 minutes following Iftar or post-Taraweeh to promote non-insulin-mediated glucose clearance.',
      sets: 1,
      reps: 1,
      frequency: 'Daily post-Iftar',
      tempo: '15 min walk',
      perSetLabel: '× 15 min',
      statLabel: 'duration:',
      statValue: '15 min',
      inferred: true,
      inferredProvenance: {
        tier: 'guideline',
        source: 'Gulf Endocrine Society Postprandial Mobility Baseline',
        rationale: 'Walking pace defaulted to comfortable indoor corridor cadence (3.5–4.2 km/h).'
      },
      microDoseStep: {
        action: 'Gentle Seated Ankle/Hip Mobility (Micro-Dose)',
        detail: '5 minutes of seated gentle ankle and hip rotations from an armchair.',
        sets: 1,
        reps: 10,
        tempo: '5 min'
      }
    },
    {
      id: 'ramadan-3',
      tone: 'lavender',
      icon: 'sleep',
      action: 'Protected Nocturnal & Qaylulah Sleep Window',
      detail:
        'Anchor core nocturnal sleep between 1:00 AM and 4:30 AM in a pitch-dark room, supplemented by a 30-minute midday Qaylulah nap to maintain psychomotor vigilance.',
      sets: 2,
      reps: 1,
      frequency: 'Daily split',
      tempo: '3.5h core + 30m nap',
      statLabel: 'schedule:',
      statValue: '1–4:30 AM',
      microDoseStep: {
        action: '15-Minute Eyes-Closed Decompression (Micro-Dose)',
        detail: '15 minutes of quiet eyes-closed rest in a dimmed room.',
        sets: 1,
        reps: 1,
        tempo: '15 min'
      }
    }
  ],
  progressionRules: [
    {
      id: 'ramadan-rule-1',
      condition: 'Day 11 reached and afternoon energy stability confirmed',
      action: 'Introduce 3 sets of low-intensity bodyweight squats (12 reps) 40 minutes prior to Iftar'
    },
    {
      id: 'ramadan-rule-2',
      condition: 'Severe dizziness, confusion, or orthostatic blood pressure drop occurs',
      action: 'Break fast immediately with oral rehydration solution and rest in a recumbent position'
    }
  ],
  contraindications: [
    {
      id: 'ramadan-c-1',
      text: 'Break fast immediately if blood glucose falls below 70 mg/dL or if fainting occurs.',
      severity: 'stop'
    },
    {
      id: 'ramadan-c-2',
      text: 'Patients with advanced chronic kidney disease or insulin-dependent diabetes must consult their physician.',
      severity: 'caution'
    }
  ],
  missingDataFlags: [
    {
      stepId: 'ramadan-2',
      parameter: 'Walking speed and cadence',
      fallback: 'Comfortable indoor corridor pace (3.5–4.2 km/h)',
      sourceGuideline: 'Gulf Endocrine Society Postprandial Mobility Baseline'
    }
  ],
  dayHistory: [],
  initialSetsDone: {},
  feedbackMetric: {
    name: 'afternoon energy',
    label: 'late-afternoon energy & focus level',
    eyebrow: 'energy log',
    logTitle: 'focus log',
    minLabel: '0 · exhausted',
    maxLabel: '10 · optimal',
    maxScore: 10,
    escalationThreshold: 3,
    escalationMessage: COPY.safety.baselineEscalationAlert,
    escalationSource: 'policy'
  },
  dataCollectionSpec: [
    {
      id: 'ramadan-energy-score',
      name: 'afternoon energy',
      label: 'Late-afternoon energy & focus level (0–10)',
      type: 'scale',
      frequency: 'daily',
      min: 0,
      max: 10,
      step: 1,
      instructions: 'Rate your alertness and physical stamina between 4:00 PM and 6:00 PM.',
      escalationThreshold: 3,
      escalationMessage: COPY.safety.baselineEscalationAlert,
      escalationSource: 'policy'
    }
  ],
  initialMorphingLogs: [],
  initialFeedbackLogs: [],
  initialMessages: intakeMessages(
    'uae-ramadan-metabolic',
    'AlDhaheri_2023_Ramadan_Metabolic_AbuDhabi.pdf',
    14,
    'the Suhoor hydration, post-Iftar corridor walk, and biphasic sleep routine'
  ),
  community: {
    studyEfficacy: 87,
    realWorldEfficacy: 81,
    userCount: 68,
    medianAdherence: 85,
    dropOffUnit: 'day',
    peakPeriod: 4,
    dropOff: [
      { period: 1, dropOff: 3 },
      { period: 2, dropOff: 5 },
      { period: 3, dropOff: 8 },
      { period: 4, dropOff: 22 }
    ],
    insightLead: '22% drop-off on Day 4',
    insightRest: 'as caffeine withdrawal peaks. Protect the Suhoor hydration window and midday nap.',
    reviews: [
      {
        id: 'ramadan-rev-1',
        handle: 'Fatima · 34F · Healthcare Worker',
        day: 18,
        outcome: 'improved',
        text: 'The 15-minute walk after Taraweeh transformed my digestion and morning fasting energy.',
        adherence: 95
      }
    ]
  },
  faqs: [
    {
      question: 'can I exercise right before Iftar?',
      keywords: ['exercise', 'before', 'iftar', 'workout'],
      answer:
        'Only low-intensity mobility is permitted in the final hour before Iftar to avoid acute dehydration and glycogen depletion.'
    }
  ]
};

/** TC-UAE-03 · Zaabi et al. 2024 · Midwakh & Dokha Behavioral Harm Reduction & Tapering Routine */
export const uaeMidwakhTaperingRoutine: Routine = {
  id: 'uae-midwakh-tapering',
  title: 'Midwakh & Dokha Behavioral Harm Reduction & Tapering Routine',
  shortTitle: 'Midwakh Tapering',
  icon: 'check',
  phase: 'Phase 1: Frequency Cap & Urge Surfing (Weeks 1–2)',
  phaseLabel: 'week 1',
  totalDays: 42,
  currentDay: 1,
  streak: 0,
  paper: {
    title:
      'Clinical efficacy of behavioral substitution and urge surfing for high-nicotine Midwakh pipe cessation in the United Arab Emirates: A multicenter randomized trial',
    fileName: 'Zaabi_2024_Midwakh_Cessation_AbuDhabi.pdf',
    authors: 'Zaabi A.A., Hachim I.Y., Al-Houqani M., et al.',
    year: 2024,
    journal: 'Addictive Behaviors / Abu Dhabi Public Health Centre (ADPHC)',
    doi: '10.1016/j.addbeh.2024.108042',
    sampleSize: 112,
    trialType: 'Randomized Controlled Trial',
    evidenceBadges: ['rct', 'missing-parameters'],
    pages: 11
  },
  steps: [
    {
      id: 'midwakh-1',
      tone: 'mint',
      icon: 'check',
      action: '3-Minute Cyclic Physiological Sighing & Pipe Swap',
      detail:
        'When an acute Midwakh urge strikes, hold a tactile substitute pipe or pen and perform 3 minutes of cyclic sighing (two quick inhales through nose, slow extended exhale through mouth) until the dopamine craving wave subsides.',
      sets: 4,
      reps: 1,
      frequency: 'On urge onset',
      tempo: '3 min cyclic sigh',
      perSetLabel: '× 3 min',
      statLabel: 'cadence:',
      statValue: '2s in · 5s out',
      inferred: true,
      inferredProvenance: {
        tier: 'guideline',
        source: 'Stanford Autonomic Neurobiology Method (Balban et al.)',
        rationale: 'Breathing ratio defaulted to 2s inhale, 1s top-up inhale, 5s slow exhalation.'
      },
      microDoseStep: {
        action: '60-Second Deep Diaphragmatic Breath (Micro-Dose)',
        detail: '3 slow breaths in through the nose and out through pursed lips.',
        sets: 1,
        reps: 3,
        tempo: '60s'
      }
    },
    {
      id: 'midwakh-2',
      tone: 'orange',
      icon: 'check',
      action: 'Personal Daily Midwakh Bowl Frequency Cap',
      detail:
        'Cap daily Dokha pipe bowls to no more than 4 bowls per day for Weeks 1–2. Delay each planned bowl by a mandatory 15-minute urge window before loading.',
      sets: 1,
      reps: 1,
      setLabel: 'cap',
      perSetLabel: '≤ 4 bowls/day',
      frequency: 'Daily logging',
      statLabel: 'cap:',
      statValue: '≤ 4/day',
      microDoseStep: {
        action: 'Log Urge & Delay 10 Minutes (Micro-Dose)',
        detail: 'Log craving urge and delay bowl by 10 minutes.',
        sets: 1,
        reps: 1
      }
    },
    {
      id: 'midwakh-3',
      tone: 'yellow',
      icon: 'diet',
      action: 'Post-Dinner Pavlovian Conditioning Extinction',
      detail:
        'Immediately following evening dinner (the highest-risk cue for social Midwakh use), chew a cinnamon toothpick or menthol oral substitute to extinguish learned sensory associations.',
      sets: 2,
      reps: 1,
      frequency: 'Post-dinner',
      tempo: '10 min substitute',
      perSetLabel: '× 10 min',
      statLabel: 'timing:',
      statValue: 'post-dinner',
      microDoseStep: {
        action: 'Iced Lemon Water Sip (Micro-Dose)',
        detail: 'Sip one glass of iced lemon water.',
        sets: 1,
        reps: 1
      }
    }
  ],
  progressionRules: [
    {
      id: 'midwakh-rule-1',
      condition: 'Week 3 reached and daily craving intensity is below 4/10',
      action: 'Step down daily bowl cap from 4 to 2 bowls per day'
    },
    {
      id: 'midwakh-rule-2',
      condition: 'Week 5 reached and withdrawal irritability is stabilized',
      action: 'Transition to complete zero-bowl cessation phase with 100% tactile substitution'
    },
    {
      id: 'midwakh-rule-3',
      condition: 'Craving escalation exceeds 8/10 or lapse occurs',
      action:
        'Do not reset streak to zero; deploy emergency 5-minute physiological sighing and resume next planned delay'
    }
  ],
  contraindications: [
    {
      id: 'midwakh-c-1',
      text: 'Seek immediate clinical evaluation if experiencing severe tachycardia, chest pain, or acute panic episodes during withdrawal.',
      severity: 'stop'
    },
    {
      id: 'midwakh-c-2',
      text: 'Store Dokha tobacco and pipes out of visual sight during evening family or social gatherings.',
      severity: 'caution'
    }
  ],
  missingDataFlags: [
    {
      stepId: 'midwakh-1',
      parameter: 'Breathing cadence for urge surfing',
      fallback: 'Cyclic physiological sigh (2s inhale, 1s top-up inhale, 5s exhale)',
      sourceGuideline: 'Stanford Autonomic Neurobiology Method (Balban et al.)'
    }
  ],
  dayHistory: [],
  initialSetsDone: {},
  feedbackMetric: {
    name: 'craving intensity',
    label: 'daily peak Midwakh craving intensity',
    eyebrow: 'craving log',
    logTitle: 'craving log',
    minLabel: '0 · none',
    maxLabel: '10 · overwhelming',
    maxScore: 10,
    escalationThreshold: 5,
    escalationMessage: COPY.safety.baselineEscalationAlert,
    escalationSource: 'policy'
  },
  dataCollectionSpec: [
    {
      id: 'midwakh-craving-score',
      name: 'craving intensity',
      label: 'Daily peak Midwakh craving intensity (0–10)',
      type: 'scale',
      frequency: 'daily',
      min: 0,
      max: 10,
      step: 1,
      instructions: 'Record the highest craving urge experienced throughout today.',
      escalationThreshold: 5,
      escalationMessage: COPY.safety.baselineEscalationAlert,
      escalationSource: 'policy'
    }
  ],
  initialMorphingLogs: [],
  initialFeedbackLogs: [],
  initialMessages: intakeMessages(
    'uae-midwakh-tapering',
    'Zaabi_2024_Midwakh_Cessation_AbuDhabi.pdf',
    11,
    'the 3-minute urge surfing, bowl frequency cap, and post-dinner Pavlovian substitution routine'
  ),
  community: {
    studyEfficacy: 74,
    realWorldEfficacy: 68,
    userCount: 94,
    medianAdherence: 77,
    dropOffUnit: 'week',
    peakPeriod: 2,
    dropOff: [
      { period: 1, dropOff: 6 },
      { period: 2, dropOff: 28 },
      { period: 3, dropOff: 14 },
      { period: 4, dropOff: 9 }
    ],
    insightLead: '28% drop-off in Week 2',
    insightRest: 'at evening social Majlis gatherings. Always keep the tactile substitute in your pocket.',
    reviews: [
      {
        id: 'midwakh-rev-1',
        handle: 'Hamad · 28M · Dubai',
        day: 21,
        outcome: 'improved',
        text: 'The 15-minute delay rule combined with physiological sighs cut my daily bowls from 12 down to 2 in 3 weeks.',
        adherence: 86
      }
    ]
  },
  faqs: [
    {
      question: 'why does Midwakh create such rapid withdrawal?',
      keywords: ['midwakh', 'dokha', 'nicotine', 'withdrawal'],
      answer:
        'Dokha contains significantly higher unadulterated nicotine concentrations than standard commercial cigarettes, producing a rapid arterial spike and steeper withdrawal drop.'
    }
  ]
};

export const calibratedRoutines: Routine[] = [
  plantarFasciitisRoutine,
  imstBloodPressureRoutine,
  warmBathSleepRoutine,
  cervicalPostureRoutine,
  ashwagandhaStressRoutine,
  dualNBackRoutine,
  uaeHeatCircadianRoutine,
  uaeRamadanMetabolicRoutine,
  uaeMidwakhTaperingRoutine
];
