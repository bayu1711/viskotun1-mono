/** Pain scale */
export const PAIN_SCORE_MIN = 0;
export const PAIN_SCORE_MAX = 10;
export const PAIN_SCORE_DEFAULT = 2;
export const PAIN_SCORE_STEP = 1;
export const PAIN_MILD_MAX = 3;
export const PAIN_MODERATE_MAX = 6;
export const PAIN_ESCALATION_THRESHOLD = 4;
export const PAIN_NOTE_MAX_LENGTH = 280;
export const DEFAULT_CONFIRMATION_PAIN_SCORE = 1;

/** Default feedback metric when paper omits custom subjective measures */
export const DEFAULT_FEEDBACK_METRIC = {
  name: 'pain',
  label: 'pain / side effect',
  eyebrow: 'pain',
  logTitle: 'log',
  minLabel: '0 · none',
  maxLabel: '10 · severe',
  maxScore: PAIN_SCORE_MAX,
  escalationThreshold: PAIN_ESCALATION_THRESHOLD
} as const;

/** Progression & safety rules */
export const PROGRESSION_WINDOW_LOGS = 3;
export const PROGRESSION_MAX_PAIN_SCORE = 2;
export const LOAD_REDUCTION_PERCENT = 20;

/** Adherence & insights thresholds */
export const PERCENT_MAX = 100;
export const ADHERENCE_HIGH_MIN = 85;
export const ADHERENCE_MODERATE_MIN = 65;
export const DROP_OFF_HIGH_MIN = 25;

/** Calendar */
export const CALENDAR_WINDOW_DAYS = 28;

/** Greeting boundaries (24h clock) */
export const MORNING_END_HOUR = 12;
export const AFTERNOON_END_HOUR = 18;

/** Timing */
export const ASSISTANT_REPLY_DELAY_MS = 900;
export const SCROLL_TO_LATEST_DELAY_MS = 120;
export const EXTRACTION_STAGE_MS = 1300;
export const EXTRACTION_TICK_MS = 250;
export const EXPORT_SIMULATED_DELAY_MS = 1600;

/** Files & links */
export const PDF_MIME_TYPE = 'application/pdf';
export const PDF_EXTENSION = '.pdf';
export const PDF_ACCEPT = `${PDF_MIME_TYPE},${PDF_EXTENSION}`;
export const DOI_BASE_URL = 'https://doi.org/';
export const PAPER_LINK_PATTERN = /(10\.\d{4,}\/\S+|doi\.org|pubmed|ncbi\.nlm|^https?:\/\/)/i;

/** Charts */
export const CHART_TICK_FONT_SIZE = 11;
export const CHART_BAR_RADIUS = 10;
export const CHART_MARGIN = { top: 4, right: 0, bottom: 0, left: 0 };

/** Typing indicator */
export const TYPING_DOT_COUNT = 3;

/** Motion presets */
export const MOTION = {
  fade: { duration: 0.15 },
  message: { duration: 0.25 },
  progress: { duration: 0.5, ease: 'easeOut' },
  sheetSpring: { type: 'spring', stiffness: 320, damping: 32 },
  dialogSpring: { type: 'spring', stiffness: 340, damping: 32 },
  sheetOffsetY: 40,
  dialogOffsetY: 48,
  popoverOffsetY: -6,
  messageOffsetY: 8,
  typingDot: { duration: 0.6, staggerS: 0.12, liftPx: -4 }
} as const;