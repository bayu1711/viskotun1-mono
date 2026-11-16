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
}

export interface RegionContext {
  countryCode: string;
  countryName: string;
  city?: string;
  detectedBy: 'middleware_header' | 'client_timezone' | 'user_selected' | 'default_uae';
  confirmed: boolean;
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
  lifestyleProfile?: UserLifestyleProfile;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAdmin: boolean;
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
