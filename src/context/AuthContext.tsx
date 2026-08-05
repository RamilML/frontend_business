import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, LoginCredentials, ApiConfig } from '../types/auth';
import { AuthService, MOCK_USERS } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  apiConfig: ApiConfig;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (role: UserRole) => void;
  updateApiConfig: (config: Partial<ApiConfig>) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => AuthService.getStoredUser());
  const [token, setToken] = useState<string | null>(() => AuthService.getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => AuthService.getConfig());

  useEffect(() => {
    // Проверка актуальности сессии при старте
    const initAuth = async () => {
      if (token && !apiConfig.useMock) {
        setIsLoading(true);
        const currentUser = await AuthService.fetchMe();
        if (currentUser) {
          setUser(currentUser);
        } else {
          setUser(null);
          setToken(null);
        }
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AuthService.login(credentials);
      setUser(response.user);
      setToken(response.tokens.accessToken);
    } catch (err: any) {
      setError(err.message || 'Ошибка входа в систему');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.clearSession();
    setUser(null);
    setToken(null);
    setError(null);
  };

  const quickSwitchRole = (role: UserRole) => {
    const mockUser = MOCK_USERS[role];
    if (mockUser) {
      const mockToken = `mock_jwt_${role}_${Date.now()}`;
      AuthService.saveSession(mockUser, mockToken);
      setUser(mockUser);
      setToken(mockToken);
      setError(null);
    }
  };

  const updateApiConfig = (newConfig: Partial<ApiConfig>) => {
    const updated = AuthService.saveConfig(newConfig);
    setApiConfig(updated);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        error,
        apiConfig,
        login,
        logout,
        quickSwitchRole,
        updateApiConfig,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};
