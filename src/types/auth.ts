export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  isGuest: boolean;
  role?: UserRole;
  avatarUrl?: string;
  createdAt: number;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  loginAsGuest: () => void;
  loginAsAdmin: () => void;
  loginWithEmail: (email: string, password?: string, asAdmin?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signupWithEmail: (name: string, email: string, password?: string, asAdmin?: boolean) => Promise<void>;
  logout: () => void;
}
