import type { Routine, Protocol } from '../types/routine';
import { achillesRoutine } from './routines/achilles';
import { hairLossRoutine } from './routines/hairLoss';
import { FALLBACK_CREATINE_SLEEP } from '../server/fallbackRoutines';

export interface SamplePaper {
  id: string;
  title: string;
  shortTitle: string;
  domain: string;
  category: 'rehab' | 'dermatology' | 'nutrition' | 'metabolic' | 'circadian' | 'gatekeeper-test';
  authors: string;
  journal: string;
  year: number;
  doi: string;
  pmcId?: string;
  openAccessUrl: string;
  pdfUrl: string;
  summary: string;
  featuresTested: string[];
  routineId?: string; // Pre-calibrated routine available for instant 1-click loading
  protocolId?: string; // Pre-calibrated protocol available for instant 1-click loading (alias)
  isGuardrailRejectionTest?: boolean;
}

export const SAMPLE_PAPERS: SamplePaper[] = [
  {
    id: 'achilles-rehab',
    title: 'Eccentric Exercise Versus Eccentric Exercise and Soft Tissue Treatment (Astym) in the Management of Insertional Achilles Tendinopathy',
    shortTitle: 'Achilles Tendinopathy Rehab',
    domain: 'Musculoskeletal Rehabilitation & Physical Therapy',
    category: 'rehab',
    authors: 'McCormack J.R., Underwood F.B., Slaven E.J., Cappaert T.A.',
    journal: 'Sports Health',
    year: 2016,
    doi: '10.1177/1941738116630843',
    pmcId: 'PMC4981065',
    openAccessUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4981065/',
    pdfUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4981065/pdf/10.1177_1941738116630843.pdf',
    summary:
      'A prospective randomized trial comparing eccentric heel drops versus combined soft tissue therapy across 12 weeks with long-term 52-week follow-up.',
    featuresTested: [
      'Sets & reps counter (3 × 15 drops)',
      '3-second slow eccentric lowering cadence',
      '0–10 Tendon discomfort slider',
      'Dynamic 20% load reduction when threshold exceeded'
    ],
    routineId: 'achilles',
    protocolId: 'achilles'
  },
  {
    id: 'hair-regrowth',
    title: 'A Randomized Evaluator Blinded Study of Effect of Microneedling in Androgenetic Alopecia: A Pilot Study',
    shortTitle: 'Alopecia Hair Regrowth',
    domain: 'Dermatology & Hair Regeneration',
    category: 'dermatology',
    authors: 'Dhurat R., Sukesh M.S., Avhad G., Dandale A., Pal A., Pund P.',
    journal: 'International Journal of Trichology',
    year: 2013,
    doi: '10.4103/0974-7753.114700',
    pmcId: 'PMC3746236',
    openAccessUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3746236/',
    pdfUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3746236/pdf/IJT-5-6.pdf',
    summary:
      'A randomized trial evaluating weekly 1.5mm scalp microneedling combined with twice-daily 5% topical minoxidil versus minoxidil monotherapy.',
    featuresTested: [
      'Dual-cadence routine (daily topical + weekly dermaroller)',
      'Milestone photo assessment (Day 1, 14, 30, 84)',
      'Morphing split photo comparison visualizer',
      'Scalp irritation & erythema biofeedback'
    ],
    routineId: 'hair-loss',
    protocolId: 'hair-loss'
  },
  {
    id: 'creatine-sleep',
    title: 'Single Dose Creatine Improves Cognitive Performance and Induces Changes in Cerebral High Energy Phosphates During Sleep Deprivation',
    shortTitle: 'Creatine & Cognitive Fatigue',
    domain: 'Cognitive Nootropics & Ergogenic Supplementation',
    category: 'nutrition',
    authors: 'Gordji-Nejad A., Matusch A., Kleedörfer S., Patel H.J., et al.',
    journal: 'Scientific Reports',
    year: 2024,
    doi: '10.1038/s41598-024-54249-9',
    pmcId: 'PMC10902318',
    openAccessUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10902318/',
    pdfUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10902318/pdf/41598_2024_Article_54249.pdf',
    summary:
      'Double-blind randomized crossover study demonstrating that acute creatine supplementation rescues cognitive reaction latency and vigilance during sleep deficit.',
    featuresTested: [
      'Standardized 5g morning dose tracking',
      'Psychomotor Vigilance Test reaction timer (PVT)',
      'Stanford Sleepiness scale (multichoice chip selector)',
      'GI distress biofeedback & split dose rule'
    ],
    routineId: 'creatine-sleep',
    protocolId: 'creatine-sleep'
  },
  {
    id: 'time-restricted-eating',
    title: 'Early Time-Restricted Feeding Improves Insulin Sensitivity, Blood Pressure, and Oxidative Stress Even without Weight Loss in Men with Prediabetes',
    shortTitle: 'Early Time-Restricted Fasting',
    domain: 'Metabolic Health & Chronobiology',
    category: 'metabolic',
    authors: 'Sutton E.F., Beyl R., Early K.S., Cefalu W.T., Ravussin E., Peterson C.M.',
    journal: 'Cell Metabolism',
    year: 2018,
    doi: '10.1016/j.cmet.2018.04.010',
    pmcId: 'PMC5990470',
    openAccessUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5990470/',
    pdfUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5990470/pdf/nihms964344.pdf',
    summary:
      'First randomized controlled trial in humans showing that a 6-hour daily eating window (fasting from 2 PM to 8 AM) improves glycemic control and cardiometabolic markers independently of weight reduction.',
    featuresTested: [
      'Daily 6-hour eating window countdown timer',
      'Blood glucose numeric stepper (mg/dL)',
      'Blood pressure readings (mmHg)',
      'Fasting adherence tracking'
    ]
  },
  {
    id: 'light-circadian',
    title: 'Preventing Sleep Disruption With Bright Light Therapy During Chemotherapy: A Phase II Randomized Controlled Trial',
    shortTitle: 'Bright Light Circadian Therapy',
    domain: 'Circadian Photobiology & Sleep Hygiene',
    category: 'circadian',
    authors: 'Wu H.S., Davis J.E., et al.',
    journal: 'Supportive Care in Cancer',
    year: 2022,
    doi: '10.1007/s00520-022-06927-4',
    pmcId: 'PMC8912437',
    openAccessUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8912437/',
    pdfUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8912437/pdf/nihms-1768407.pdf',
    summary:
      'Randomized trial evaluating 30-minute daily exposure to 10,000-lux bright white light upon waking to preserve circadian rhythm and subjective sleep quality.',
    featuresTested: [
      'Morning 30-minute exposure countdown timer',
      'Lux intensity compliance verification',
      'Sleep disturbance rating scale',
      'Circadian fatigue logs'
    ]
  },
  {
    id: 'rodent-exercise-model',
    title: 'Weight Pulling: A Novel Mouse Model of Human Progressive Resistance Exercise',
    shortTitle: 'Rodent Resistance Exercise (Rejection Test)',
    domain: 'Preclinical Animal Model (Non-Human)',
    category: 'gatekeeper-test',
    authors: 'Investigators in Experimental Physiology',
    journal: 'Frontiers in Physiology',
    year: 2021,
    doi: '10.3389/fphys.2021.734879',
    pmcId: 'PMC8465477',
    openAccessUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8465477/',
    pdfUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8465477/pdf/41598_2021_98555-5.pdf',
    summary:
      'Preclinical in vivo study in mice evaluating hypertrophy from weighted wheel pulling. Used to test the ViskotuN1 AI safety gatekeeper.',
    featuresTested: [
      'Triggers automated Gatekeeper rejection',
      'Firestore Policy Ledger keyword detection (rodent / mouse)',
      'Educational clinical guidance prompt'
    ],
    isGuardrailRejectionTest: true
  }
];

export const PRECALIBRATED_SAMPLE_ROUTINES: Record<string, Routine> = {
  achilles: achillesRoutine,
  'hair-loss': hairLossRoutine,
  'creatine-sleep': FALLBACK_CREATINE_SLEEP
};

export const PRECALIBRATED_SAMPLE_PROTOCOLS: Record<string, Protocol> = PRECALIBRATED_SAMPLE_ROUTINES;
