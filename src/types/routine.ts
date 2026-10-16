export type EvidenceBadge = 'rct' | 'pilot' | 'missing-parameters';

export interface PaperMeta {
  title: string;
  fileName: string;
  authors: string;
  year: number;
  journal: string;
  doi: string;
  sampleSize: number;
  trialType: string;
  evidenceBadges: EvidenceBadge[];
  pages: number;
}

export type Tone = 'ink' | 'cream' | 'mint';
export type StepIconKey =
  | 'straight-knee'
  | 'bent-knee'
  | 'stretch'
  | 'serum'
  | 'microneedle'
  | 'shampoo'
  | 'fitness'
  | 'pill'
  | 'timer'
  | 'heart'
  | 'science'
  | 'water'
  | 'brain'
  | 'sleep'
  | 'sun'
  | 'diet'
  | 'walk'
  | 'check';

export interface RoutineStep {
  id: string;
  tone: Tone;
  icon: StepIconKey;
  action: string;
  detail: string;
  sets: number;
  reps: number;
  frequency: string;
  tempo?: string;
  durationSeconds?: number;
  inferred?: boolean;
  /** Unit name for a "set" (e.g. "doses", "session"). Defaults to "sets". */
  setLabel?: string;
  /** Per-set description (e.g. "× 1 mL"). Defaults to reps or hold time. */
  perSetLabel?: string;
  /** Primary parameter shown on wide cards (e.g. "dose:" / "1 mL"). */
  statLabel?: string;
  statValue?: string;
}

/** Backward-compatibility alias */
export type ProtocolStep = RoutineStep;

export interface ProgressionRule {
  id: string;
  condition: string;
  action: string;
}

export interface Contraindication {
  id: string;
  text: string;
  severity: 'stop' | 'caution';
}

export interface MissingDataFlag {
  stepId: string;
  parameter: string;
  fallback: string;
}

export type WidgetType =
  | 'scale'
  | 'numeric'
  | 'photo'
  | 'timer'
  | 'multichoice'
  | 'boolean';

export interface DataCollectionField {
  id: string;
  name: string;
  label: string;
  type: WidgetType;
  frequency: 'daily' | 'milestone' | 'weekly';
  milestoneDays?: number[];
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  instructions?: string;
  escalationThreshold?: number;
  escalationMessage?: string;
}

export interface MorphingDataLog {
  id: string;
  fieldId: string;
  day: number;
  loggedAt: string;
  value: number | string | boolean;
  note?: string;
}

export interface FeedbackMetric {
  name: string;
  label: string;
  eyebrow?: string;
  logTitle?: string;
  minLabel?: string;
  maxLabel?: string;
  maxScore?: number;
  escalationThreshold?: number;
  escalationMessage?: string;
}

export interface FeedbackLog {
  id: string;
  day: number;
  score: number;
  note: string;
  loggedAt: string;
}

export type ChatRole = 'user' | 'ai';
export type ChatKind =
  | 'text'
  | 'file'
  | 'routine'
  | 'protocol'
  | 'alert'
  | 'confirmation'
  | 'question'
  | 'answer'
  | 'processing';

export type AIEngineType = 'on-device-gemma' | 'cloud-gemini' | 'server-gemma' | 'local-rules';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  kind: ChatKind;
  content: string;
  timestamp: string;
  createdAt?: number;
  engine?: AIEngineType;
  source?: string;
}

export interface CommunityReview {
  id: string;
  handle: string;
  day: number;
  outcome: 'improved' | 'adjusted' | 'paused';
  text: string;
  adherence: number;
  createdAt?: string;
  userId?: string;
}

export interface NewCommunityReview {
  handle?: string;
  day: number;
  outcome: 'improved' | 'adjusted' | 'paused';
  text: string;
  adherence: number;
  userId?: string;
}

export interface DropOffPoint {
  period: number;
  dropOff: number;
}

export interface CommunityInsights {
  studyEfficacy: number;
  realWorldEfficacy: number;
  userCount: number;
  medianAdherence: number;
  dropOffUnit: 'day' | 'week';
  peakPeriod: number;
  dropOff: DropOffPoint[];
  insightLead: string;
  insightRest: string;
  reviews: CommunityReview[];
}

export interface PaperFaq {
  question: string;
  keywords: string[];
  answer: string;
}

export interface Routine {
  id: string;
  canonicalId?: string;
  isCanonical?: boolean;
  title: string;
  shortTitle: string;
  icon: StepIconKey;
  phase: string;
  phaseLabel: string;
  totalDays: number;
  currentDay: number;
  streak: number;
  paper: PaperMeta;
  steps: RoutineStep[];
  progressionRules: ProgressionRule[];
  contraindications: Contraindication[];
  missingDataFlags: MissingDataFlag[];
  /** Completion ratio (0–1) for each day before the current day, index 0 = day 1. */
  dayHistory: number[];
  initialSetsDone: Record<string, number>;
  initialFeedbackLogs?: FeedbackLog[];
  feedbackMetric?: FeedbackMetric;
  dataCollectionSpec?: DataCollectionField[];
  initialMorphingLogs?: MorphingDataLog[];
  initialMessages: ChatMessage[];
  community: CommunityInsights;
  faqs: PaperFaq[];
}

/** Backward-compatibility alias */
export type Protocol = Routine;

export interface QueuedPaper {
  id: string;
  name: string;
  note: string;
}

export type ReviewOutcome = CommunityReview['outcome'];
export type ReviewFilter = 'all' | ReviewOutcome;
export type DropOffUnit = CommunityInsights['dropOffUnit'];

/** Mutable, per-routine session state (everything else is derived during render). */
export interface RoutineRuntime {
  setsDone: Record<string, number>;
  feedbackLogs: FeedbackLog[];
  morphingLogs?: MorphingDataLog[];
  messages: ChatMessage[];
  escalationPaused: boolean;
  assistantTyping?: boolean;
}

/** Backward-compatibility alias */
export type ProtocolRuntime = RoutineRuntime;

export interface RoutineSummary {
  id: string;
  title: string;
  shortTitle: string;
  icon: StepIconKey;
  currentDay: number;
  totalDays: number;
  todayPercent: number;
  todayFraction: number;
  streak: number;
}

/** Backward-compatibility alias */
export type ProtocolSummary = RoutineSummary;

export type NewChatMessage = Omit<ChatMessage, 'id' | 'timestamp'> & { id?: string };

/** Persistent paper document contract stored in the unified Firebase papers table */
export interface StoredPaper {
  id: string;
  title: string;
  shortTitle: string;
  domain: string;
  category: string;
  authors: string;
  journal: string;
  year: number;
  doi: string;
  pmcId?: string;
  openAccessUrl: string;
  pdfUrl: string;
  summary: string;
  featuresTested: string[];
  routineId?: string;
  protocolId?: string;
  isSample: boolean;
  isGuardrailRejectionTest?: boolean;
  routine?: Routine;
  protocol?: Routine;
  userId?: string | null;
  createdAt: number;
  updatedAt: number;
}
