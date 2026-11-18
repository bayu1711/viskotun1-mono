import type { BctTaxonomyEntry } from '../types/bct';

/**
 * Standardized BCT Taxonomy v1 Mappings for TrialN1
 * Reference: Michie S, et al. The Behavior Change Technique Taxonomy (v1).
 * Annals of Behavioral Medicine, 2013; 46(1):81-95.
 */
export const BCT_TAXONOMY_ENTRIES: BctTaxonomyEntry[] = [
  {
    code: 'BCT 1.1',
    cluster: '1. Goals and planning',
    name: 'Goal setting (behavior)',
    description: 'Set or agree on a goal defined in terms of the behavior to be achieved.',
    viskotuImplementation:
      'Daily prescribed steps derived directly from human clinical trial methods (sets, reps, tempos, and hold times).',
    mechanismOfAction:
      'Directs attention and effort toward goal-relevant activities and away from irrelevant actions.',
    targetBarriers: ['sedentary_routine', 'unclear_guidelines']
  },
  {
    code: 'BCT 1.2',
    cluster: '1. Goals and planning',
    name: 'Problem solving / Barrier identification',
    description:
      'Analyze factors influencing the behavior and generate or select strategies that overcome barriers.',
    viskotuImplementation:
      'Adaptive Re-Entry triage identifies specific Gulf friction points (48°C heat, 14h shift fatigue, Ramadan fasting, travel) and modifies the day accordingly.',
    mechanismOfAction:
      'Enhances coping self-efficacy and preempts intention-behavior gaps under environmental stress.',
    targetBarriers: [
      'extreme_heat_summer',
      'healthcare_shift_worker',
      'ramadan_fasting',
      'fatigue_energy'
    ]
  },
  {
    code: 'BCT 1.4',
    cluster: '1. Goals and planning',
    name: 'Action planning',
    description:
      'Prompt detailed planning of performance of the behavior (context, frequency, duration, intensity).',
    viskotuImplementation:
      'Preset timing windows (e.g. pre-8 AM morning light, post-Iftar movement, Suhoor hydration schedule).',
    mechanismOfAction:
      'Forms strong implementation intentions linking situational cues directly to behavior initiation.',
    targetBarriers: ['ramadan_fasting', 'healthcare_shift_worker']
  },
  {
    code: 'BCT 2.2',
    cluster: '2. Feedback and monitoring',
    name: 'Feedback on behavior',
    description: 'Monitor and provide informative or evaluative feedback on performance of the behavior.',
    viskotuImplementation:
      'Live set logging, interactive progression bars, real-time voice coach tempos, and adherence percentages.',
    mechanismOfAction:
      'Enables cybernetic discrepancy reduction between desired standard and current state.',
    targetBarriers: ['poor_adherence', 'inconsistent_tempo']
  },
  {
    code: 'BCT 2.3',
    cluster: '2. Feedback and monitoring',
    name: 'Self-monitoring of outcome(s) of behavior',
    description: 'Establish a method for the person to monitor and record the outcome(s) of their behavior.',
    viskotuImplementation:
      'Daily biofeedback logs (Numeric Pain Rating, sleep latency, subjective fatigue, energy score).',
    mechanismOfAction:
      'Makes outcome contingencies salient and reinforces behavioral efficacy over progressive weeks.',
    targetBarriers: ['discomfort_pain', 'fatigue_energy']
  },
  {
    code: 'BCT 4.1',
    cluster: '4. Shaping knowledge',
    name: 'Instruction on how to perform the behavior',
    description: 'Advise or agree on how to perform the behavior.',
    viskotuImplementation:
      'Exact tempo breakdowns (e.g., 3s up · 2s hold · 3s down), missing parameter audits, and safety stop rules.',
    mechanismOfAction:
      'Reduces procedural ambiguity and eliminates performance anxiety or injury risk.',
    targetBarriers: ['injury_fear', 'technique_uncertainty']
  },
  {
    code: 'BCT 8.1',
    cluster: '8. Repetition and substitution',
    name: 'Behavioral substitution',
    description: 'Prompt substitution of an unwanted behavior with a wanted behavior.',
    viskotuImplementation:
      'Midwakh & Dokha urge surfing and tactile substitution routines; swapping outdoor exertion for indoor air-conditioned mobility during summer peaks.',
    mechanismOfAction:
      'Channels neurobehavioral cravings and habitual motor reflexes into harmless alternative routines.',
    targetBarriers: ['midwakh_dokha', 'shisha_waterpipe', 'extreme_heat_summer']
  },
  {
    code: 'BCT 8.7',
    cluster: '8. Repetition and substitution',
    name: 'Graded tasks / Adaptive micro-dosing',
    description:
      'Set easy-to-perform tasks, making them progressively more difficult until the target behavior is achieved.',
    viskotuImplementation:
      'Dynamic micro-dose contraction: automatically scales down 45m routines into a 3–5 min indoor micro-dose when severe barriers occur.',
    mechanismOfAction:
      'Preserves neural synaptic habit gating by minimizing activation threshold during high cognitive or environmental load.',
    targetBarriers: ['extreme_heat_summer', 'healthcare_shift_worker', 'fatigue_energy']
  },
  {
    code: 'BCT 11.2',
    cluster: '11. Regulation',
    name: 'Reduce negative emotions (Non-punitive re-entry)',
    description:
      'Advise on ways of reducing negative emotions to facilitate performance of the behavior.',
    viskotuImplementation:
      'Strict non-punitive re-entry system: never resets streaks to zero upon lapse; frames breaks as natural data points rather than failure.',
    mechanismOfAction:
      'Extinguishes the clinical Abstinence Violation Effect (AVE), preventing shame-induced program abandonment.',
    targetBarriers: ['streak_shame', 'lapse_guilt', 'time_crunch']
  },
  {
    code: 'BCT 12.1',
    cluster: '12. Antecedents',
    name: 'Restructuring the physical environment',
    description:
      'Change, or advise to change the environment in order to facilitate performance of the wanted behavior.',
    viskotuImplementation:
      'Indoor AC corridor pacing, wall isometric holds, and low-light evening setups calibrated for Gulf architecture.',
    mechanismOfAction:
      'Removes environmental friction and overcomes ambient thermal hazards.',
    targetBarriers: ['extreme_heat_summer', 'high_humidity']
  }
];
