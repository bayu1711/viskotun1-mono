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

export interface ProtocolStep {
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

export interface PainLog {
  id: string;
  day: number;
  score: number;
  note: string;
  loggedAt: string;
}

export type ChatRole = 'user' | 'ai';
export type ChatKind =
'text' |
'file' |
'protocol' |
'alert' |
'confirmation' |
'question' |
'answer' |
'processing';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  kind: ChatKind;
  content: string;
  timestamp: string;
  createdAt?: number;
}

export interface CommunityReview {
  id: string;
  handle: string;
  day: number;
  outcome: 'improved' | 'adjusted' | 'paused';
  text: string;
  adherence: number;
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

export interface Protocol {
  id: string;
  title: string;
  shortTitle: string;
  icon: StepIconKey;
  phase: string;
  phaseLabel: string;
  totalDays: number;
  currentDay: number;
  streak: number;
  paper: PaperMeta;
  steps: ProtocolStep[];
  progressionRules: ProgressionRule[];
  contraindications: Contraindication[];
  missingDataFlags: MissingDataFlag[];
  /** Completion ratio (0–1) for each day before the current day, index 0 = day 1. */
  dayHistory: number[];
  initialSetsDone: Record<string, number>;
  initialPainLogs: PainLog[];
  initialMessages: ChatMessage[];
  community: CommunityInsights;
  faqs: PaperFaq[];
}

export interface QueuedPaper {
  id: string;
  name: string;
  note: string;
}

export type ReviewOutcome = CommunityReview['outcome'];
export type ReviewFilter = 'all' | ReviewOutcome;
export type DropOffUnit = CommunityInsights['dropOffUnit'];

/** Mutable, per-protocol session state (everything else is derived during render). */
export interface ProtocolRuntime {
  setsDone: Record<string, number>;
  painLogs: PainLog[];
  messages: ChatMessage[];
  escalationPaused: boolean;
  assistantTyping?: boolean;
}

export interface ProtocolSummary {
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

export type NewChatMessage = Omit<ChatMessage, 'id' | 'timestamp'>;