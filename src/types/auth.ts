import type { AppLocale, SecondaryLanguage } from '../data/locales/types';
import type {
  AvailabilityMode,
  AvailableTimeWindow,
  ScheduleCompatibilityReport
} from './schedule';

export type UserRole = 'admin' | 'user';

export type SmokingStatus =
  | 'non_smoker'
  | 'cigarettes'
  | 'midwakh_dokha'
  | 'shisha_waterpipe'
  | 'vape'
  | 'former_smoker'
  | 'other';

export type WorkPattern =
  | 'standard'
  | 'shift_work'
  | 'desk_sedentary'
  | 'frequent_travel'
  | 'flexible';

export type ActivityBaseline = 'sedentary' | 'light' | 'moderate' | 'active';

export type CulturalRhythmId =
  | 'ramadan_fasting'
  | 'intermittent_fasting'
  | 'periodic_religious_fasting'
  | 'late_family_dinner'
  | 'early_dawn_riser'
  | 'midday_siesta_rest'
  | 'sabbath_weekly_rest'
  | 'collectivist_household';

export interface RegionalLifestyleTag {
  id: string;
  label: string;
  category: 'schedule' | 'substance' | 'culture' | 'physical' | 'environment';
  countryCode: string;
  popularityCount: number;
  description?: string;
  source?: 'ai-regional' | 'preset' | 'crowdsourced';
}

export interface RegionContext {
  countryCode: string;
  countryName: string;
  city?: string;
  detectedBy: 'middleware_header' | 'client_timezone' | 'user_selected' | 'default_uae' | 'default_global';
  confirmed: boolean;
}

export interface LifestyleAdaptationSpec {
  bannerTitle: string;
  bannerGuidance: string;
  recommendedDoseMode: 'standard' | 'micro' | 'rest';
  suggestedWindow: string;
  /** Per-step context-aware guidance tips keyed by step ID. */
  stepTips: Record<string, string>;
  /** Deterministic compatibility check between the active routine's timing rules and user availability. */
  scheduleCompatibility?: ScheduleCompatibilityReport;
  safetyGuardrailNote: string;
  guardrailVerified: boolean;
  source: 'gemini-global-ai' | 'deterministic-fallback';
  regionLabel: string;
  generatedAt: string;
}

export type BiologicalSex = 'female' | 'male' | 'other' | 'prefer_not_to_say';
export type AccountStatus = 'active' | 'deactivated';

export interface UserProfile {
  displayName?: string;
  age?: number;
  biologicalSex?: BiologicalSex;
  /** Whether the user follows specific open time windows or runs flexibly anytime. */
  availabilityMode?: AvailabilityMode;
  /** 1–4 typical open time ranges during the day (used to match paper timing rules & export calendar blocks). */
  availableWindows?: AvailableTimeWindow[];
  clinicalGoals?: string;
  /** Preferred primary UI language. */
  primaryLanguage?: AppLocale;
  /** Optional secondary UI language for quick switching in the top header. */
  secondaryLanguage?: SecondaryLanguage;
  /** Whether daily routine reminder nudges are enabled. */
  reminderNotificationsEnabled?: boolean;
  /** Whether anonymized adherence cohort insights can be shared with Community reviews. */
  communityCohortOptIn?: boolean;
  updatedAt?: string;
}

export interface UserLifestyleProfile {
  region: RegionContext;
  workPattern?: WorkPattern;
  smokingStatus?: SmokingStatus;
  activityBaseline?: ActivityBaseline;
  culturalRhythms?: CulturalRhythmId[];
  isRamadanFastingObserver?: boolean;
  climateSensitivity?: 'summer_heat' | 'cold_climate' | 'moderate';
  physicalCautions?: string[];
  activeTags: string[];
  intakeCompleted: boolean;
  lastTunedAt?: string;
  activeAdaptation?: LifestyleAdaptationSpec;
}

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  isGuest: boolean;
  role?: UserRole;
  accountStatus?: AccountStatus;
  avatarUrl?: string;
  createdAt: number;
  profile?: UserProfile;
  lifestyleProfile?: UserLifestyleProfile;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  lifestyleProfile: UserLifestyleProfile;
  updateLifestyleProfile: (updates: Partial<UserLifestyleProfile>) => void;
  confirmRegion: (countryName: string, city?: string) => void;
  resetProfileToDefaults: () => void;
  sendPasswordReset: () => Promise<void>;
  deactivateAccount: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  loginAsGuest: () => void;
  loginAsAdmin: () => void;
  loginWithEmail: (email: string, password?: string, asAdmin?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signupWithEmail: (name: string, email: string, password?: string, asAdmin?: boolean) => Promise<void>;
  logout: () => void;
}
