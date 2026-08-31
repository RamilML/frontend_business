export type UserRole = 'operator' | 'manager' | 'client' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  avatarUrl?: string;
  clientId?: string; // Привязка к контрагенту если роль 'client'
  clientName?: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface LoginCredentials {
  username: string;
  password?: string;
  role?: UserRole; // Для мокового быстрого переключения
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface ApiConfig {
  baseUrl: string;
  useMock: boolean;
  timeoutMs: number;
}
