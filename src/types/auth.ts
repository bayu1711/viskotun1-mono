export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  isGuest: boolean;
  avatarUrl?: string;
  createdAt: number;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  loginAsGuest: () => void;
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signupWithEmail: (name: string, email: string, password?: string) => Promise<void>;
  logout: () => void;
}
