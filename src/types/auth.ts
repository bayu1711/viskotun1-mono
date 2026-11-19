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
  safetyGuardrailNote: string;
  guardrailVerified: boolean;
  source: 'gemini-global-ai' | 'deterministic-fallback';
  regionLabel: string;
  generatedAt: string;
}

export type BiologicalSex = 'female' | 'male' | 'other' | 'prefer_not_to_say';

export interface UserProfile {
  displayName?: string;
  age?: number;
  biologicalSex?: BiologicalSex;
  /** Daily reminder time in 24-hour HH:mm format (used for calendar exports). */
  preferredReminderTime?: string;
  clinicalGoals?: string;
  updatedAt?: string;
}

export interface UserLifestyleProfile {
  region: RegionContext;
  workPattern?: WorkPattern;
  smokingStatus?: SmokingStatus;
  activityBaseline?: ActivityBaseline;
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
  loginAsGuest: () => void;
  loginAsAdmin: () => void;
  loginWithEmail: (email: string, password?: string, asAdmin?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signupWithEmail: (name: string, email: string, password?: string, asAdmin?: boolean) => Promise<void>;
  logout: () => void;
}
