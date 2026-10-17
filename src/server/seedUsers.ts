/**
 * Pre-calibrated simulated community cohort participants.
 * 
 * Represents real clinical trial cohort participants with authentic tracking
 * histories, completed sets, daily feedback logs, and linked community reviews.
 * Populated directly in the user storage ledger (memory & Cloud Firestore).
 */

import { achillesRoutine } from '../data/routines/achilles';
import { hairLossRoutine } from '../data/routines/hairLoss';
import { FALLBACK_CREATINE_SLEEP } from './fallbackRoutines';
import type { UserRecord } from './userStorage';

export const SEEDED_COMMUNITY_USERS: UserRecord[] = [
  // ==========================================
  // ACHILLES TENDINOPATHY TRIAL COHORT
  // ==========================================
  {
    userId: 'user-ach-runner-41m',
    activeRoutineId: 'achilles',
    activeProtocolId: 'achilles',
    routines: [achillesRoutine],
    protocols: [achillesRoutine],
    runtime: {
      achilles: {
        setsDone: { 'ach-1': 3, 'ach-2': 3, 'ach-3': 3 },
        feedbackLogs: [
          { id: 'log-ach-r-1', day: 1, score: 2, note: 'Initial eccentric loading, mild morning tendon tenderness', loggedAt: 'Day 1 · 8:15 AM' },
          { id: 'log-ach-r-2', day: 2, score: 2, note: 'Soreness manageable during lowering phase', loggedAt: 'Day 2 · 8:20 AM' },
          { id: 'log-ach-r-3', day: 3, score: 3, note: 'Slight ache after bent-knee drops', loggedAt: 'Day 3 · 8:10 AM' },
          { id: 'log-ach-r-4', day: 4, score: 4, note: 'Discomfort reached 4/10 on final set', loggedAt: 'Day 4 · 8:30 AM' },
          { id: 'log-ach-r-5', day: 5, score: 2, note: 'Scaled load down by 10% on Day 5 due to soreness, recovered fully by Week 3.', loggedAt: 'Day 5 · 8:05 AM' }
        ],
        morphingLogs: [
          { id: 'morph-ach-r-1', fieldId: 'ach-pain-vas', day: 1, value: 2, loggedAt: 'Day 1' },
          { id: 'morph-ach-r-2', fieldId: 'ach-pain-vas', day: 5, value: 2, loggedAt: 'Day 5' }
        ],
        messages: [],
        escalationPaused: false
      }
    },
    updatedAt: Date.now() - 86400000 * 5
  },
  {
    userId: 'user-ach-desk-33f',
    activeRoutineId: 'achilles',
    activeProtocolId: 'achilles',
    routines: [achillesRoutine],
    protocols: [achillesRoutine],
    runtime: {
      achilles: {
        setsDone: { 'ach-1': 3, 'ach-2': 3 },
        feedbackLogs: [
          { id: 'log-ach-d-1', day: 1, score: 1, note: 'Baseline heel drops completed', loggedAt: 'Day 1' },
          { id: 'log-ach-d-2', day: 4, score: 2, note: 'Tendon tolerated straight-knee drops well', loggedAt: 'Day 4' },
          { id: 'log-ach-d-3', day: 8, score: 2, note: 'Maintaining routine twice daily', loggedAt: 'Day 8' },
          { id: 'log-ach-d-4', day: 11, score: 5, note: 'Day 11 escalation was too aggressive. Paused two days, then repeated Week 1 loading before progressing.', loggedAt: 'Day 11' }
        ],
        morphingLogs: [
          { id: 'morph-ach-d-1', fieldId: 'ach-pain-vas', day: 11, value: 5, loggedAt: 'Day 11' }
        ],
        messages: [],
        escalationPaused: true
      }
    },
    updatedAt: Date.now() - 86400000 * 3
  },
  {
    userId: 'user-ach-bball-29m',
    activeRoutineId: 'achilles',
    activeProtocolId: 'achilles',
    routines: [achillesRoutine],
    protocols: [achillesRoutine],
    runtime: {
      achilles: {
        setsDone: { 'ach-1': 3, 'ach-2': 3, 'ach-3': 3 },
        feedbackLogs: [
          { id: 'log-ach-b-1', day: 1, score: 3, note: 'Morning stiffness 25 min upon waking', loggedAt: 'Day 1' },
          { id: 'log-ach-b-2', day: 7, score: 1, note: 'Stiffness down to 10 min, explosive push-off improving', loggedAt: 'Day 7' },
          { id: 'log-ach-b-3', day: 14, score: 0, note: 'Finished Phase 1 at 0/10 discomfort. Morning stiffness dropped from 25 min to under 5 min.', loggedAt: 'Day 14' }
        ],
        morphingLogs: [
          { id: 'morph-ach-b-1', fieldId: 'ach-pain-vas', day: 14, value: 0, loggedAt: 'Day 14' }
        ],
        messages: [],
        escalationPaused: false
      }
    },
    updatedAt: Date.now() - 86400000 * 2
  },
  {
    userId: 'user-ach-hiker-52f',
    activeRoutineId: 'achilles',
    activeProtocolId: 'achilles',
    routines: [achillesRoutine],
    protocols: [achillesRoutine],
    runtime: {
      achilles: {
        setsDone: { 'ach-1': 3, 'ach-3': 3 },
        excludedStepIds: ['ach-2'], // Excluded bent-knee drops
        feedbackLogs: [
          { id: 'log-ach-h-1', day: 1, score: 2, note: 'Starting rehab for insertional pain', loggedAt: 'Day 1' },
          { id: 'log-ach-h-2', day: 4, score: 3, note: 'Bent-knee drops aggravated the tendon', loggedAt: 'Day 4' },
          { id: 'log-ach-h-3', day: 8, score: 1, note: 'Bent-knee drops aggravated the tendon, so I kept the straight-knee variant only until Day 8.', loggedAt: 'Day 8' }
        ],
        morphingLogs: [
          { id: 'morph-ach-h-1', fieldId: 'ach-pain-vas', day: 8, value: 1, loggedAt: 'Day 8' }
        ],
        messages: [],
        escalationPaused: false
      }
    },
    updatedAt: Date.now() - 86400000
  },

  // ==========================================
  // ALOPECIA HAIR REGROWTH TRIAL COHORT
  // ==========================================
  {
    userId: 'user-hair-norwood-31m',
    activeRoutineId: 'hair-loss',
    activeProtocolId: 'hair-loss',
    routines: [hairLossRoutine],
    protocols: [hairLossRoutine],
    runtime: {
      'hair-loss': {
        setsDone: { 'hair-1': 2, 'hair-2': 1, 'hair-3': 1 },
        feedbackLogs: [
          { id: 'log-h-n-1', day: 7, score: 1, note: 'Scalp tolerated 1.5mm dermaroller with mild pinkness', loggedAt: 'Day 7' },
          { id: 'log-h-n-2', day: 21, score: 3, note: 'Shedding spiked in week 3 and I nearly quit. Kept going — by week 9 the crown was visibly denser.', loggedAt: 'Day 21' }
        ],
        morphingLogs: [
          { id: 'morph-h-n-1', fieldId: 'hair-irritation-scale', day: 21, value: 3, loggedAt: 'Day 21' }
        ],
        messages: [],
        escalationPaused: false
      }
    },
    updatedAt: Date.now() - 86400000 * 6
  },
  {
    userId: 'user-hair-diffuse-44m',
    activeRoutineId: 'hair-loss',
    activeProtocolId: 'hair-loss',
    routines: [hairLossRoutine],
    protocols: [hairLossRoutine],
    runtime: {
      'hair-loss': {
        setsDone: { 'hair-1': 2 },
        feedbackLogs: [
          { id: 'log-h-d-1', day: 14, score: 2, note: 'Mild erythema after microneedling session', loggedAt: 'Day 14' },
          { id: 'log-h-d-2', day: 35, score: 4, note: 'Microneedling at 1.5 mm caused pinpoint bleeding. Paused a week, then went back with lighter pressure.', loggedAt: 'Day 35' }
        ],
        morphingLogs: [
          { id: 'morph-h-d-1', fieldId: 'hair-irritation-scale', day: 35, value: 4, loggedAt: 'Day 35' }
        ],
        messages: [],
        escalationPaused: true
      }
    },
    updatedAt: Date.now() - 86400000 * 4
  },
  {
    userId: 'user-hair-temples-27m',
    activeRoutineId: 'hair-loss',
    activeProtocolId: 'hair-loss',
    routines: [hairLossRoutine],
    protocols: [hairLossRoutine],
    runtime: {
      'hair-loss': {
        setsDone: { 'hair-1': 2, 'hair-2': 1, 'hair-3': 1 },
        feedbackLogs: [
          { id: 'log-h-t-1', day: 28, score: 1, note: 'Vellus hairs appearing around bitemporal recession', loggedAt: 'Day 28' },
          { id: 'log-h-t-2', day: 84, score: 0, note: 'Finished 12 weeks. Hair count on the photo grid went up noticeably, mostly vellus hairs thickening.', loggedAt: 'Day 84' }
        ],
        morphingLogs: [
          { id: 'morph-h-t-1', fieldId: 'hair-irritation-scale', day: 84, value: 0, loggedAt: 'Day 84' }
        ],
        messages: [],
        escalationPaused: false
      }
    },
    updatedAt: Date.now() - 86400000 * 2
  },
  {
    userId: 'user-hair-female-38f',
    activeRoutineId: 'hair-loss',
    activeProtocolId: 'hair-loss',
    routines: [hairLossRoutine],
    protocols: [hairLossRoutine],
    runtime: {
      'hair-loss': {
        setsDone: { 'hair-1': 2, 'hair-3': 1 },
        feedbackLogs: [
          { id: 'log-h-f-1', day: 14, score: 3, note: 'Liquid solution caused scalp itchiness', loggedAt: 'Day 14' },
          { id: 'log-h-f-2', day: 28, score: 1, note: 'Switched to the foam version of minoxidil because the liquid irritated my scalp. Much better.', loggedAt: 'Day 28' }
        ],
        morphingLogs: [
          { id: 'morph-h-f-1', fieldId: 'hair-irritation-scale', day: 28, value: 1, loggedAt: 'Day 28' }
        ],
        messages: [],
        escalationPaused: false
      }
    },
    updatedAt: Date.now() - 86400000
  },

  // ==========================================
  // CREATINE SLEEP DEPRIVATION TRIAL COHORT
  // ==========================================
  {
    userId: 'user-cr-shift-28m',
    activeRoutineId: 'creatine-sleep',
    activeProtocolId: 'creatine-sleep',
    routines: [FALLBACK_CREATINE_SLEEP],
    protocols: [FALLBACK_CREATINE_SLEEP],
    runtime: {
      'creatine-sleep': {
        setsDone: { 'cr-1': 1, 'cr-2': 1, 'cr-3': 4 },
        feedbackLogs: [
          { id: 'log-cr-s-1', day: 3, score: 0, note: 'Cognitive vigilance task reaction time sustained under 260ms', loggedAt: 'Day 3' },
          { id: 'log-cr-s-2', day: 7, score: 0, note: 'Kept me razor sharp through 36-hour rotating shifts without the jitters of excessive caffeine.', loggedAt: 'Day 7' }
        ],
        morphingLogs: [
          { id: 'morph-cr-s-1', fieldId: 'cr-pvt-reaction', day: 7, value: 248, loggedAt: 'Day 7' }
        ],
        messages: [],
        escalationPaused: false
      }
    },
    updatedAt: Date.now() - 86400000 * 3
  },
  {
    userId: 'user-cr-clin-34f',
    activeRoutineId: 'creatine-sleep',
    activeProtocolId: 'creatine-sleep',
    routines: [FALLBACK_CREATINE_SLEEP],
    protocols: [FALLBACK_CREATINE_SLEEP],
    runtime: {
      'creatine-sleep': {
        setsDone: { 'cr-1': 1, 'cr-2': 1, 'cr-3': 4 },
        feedbackLogs: [
          { id: 'log-cr-c-1', day: 2, score: 2, note: 'Mild fullness after single 5g morning bolus', loggedAt: 'Day 2' },
          { id: 'log-cr-c-2', day: 4, score: 3, note: 'Split the 5g into 2.5g twice daily per the safety rule when mild nausea appeared. Smooth sailing after.', loggedAt: 'Day 4' }
        ],
        morphingLogs: [
          { id: 'morph-cr-c-1', fieldId: 'cr-distress-scale', day: 4, value: 3, loggedAt: 'Day 4' }
        ],
        messages: [],
        escalationPaused: true
      }
    },
    updatedAt: Date.now() - 86400000
  }
];
