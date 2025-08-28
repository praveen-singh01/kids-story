export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  subscription: {
    plan: 'free' | 'premium' | 'family';
    status: 'active' | 'inactive' | 'cancelled' | 'past_due';
    currentPeriodEnd?: string;
  };
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
  message: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}
