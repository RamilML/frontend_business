import { User, LoginCredentials, AuthResponse, ApiConfig } from '../types/auth';

const STORAGE_KEY_TOKEN = 'ff_assistant_token';
const STORAGE_KEY_USER = 'ff_assistant_user';
const STORAGE_KEY_CONFIG = 'ff_assistant_api_config';

export const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: 'http://localhost:8000/api/v1',
  useMock: true,
  timeoutMs: 5000,
};

// Моковые аккаунты под разные роли
export const MOCK_USERS: Record<string, User> = {
  operator: {
    id: 'usr_op_01',
    name: 'Алексей Смирнов',
    email: 'operator@fulfillment.ru',
    username: 'operator',
    role: 'operator'
  },
  manager: {
    id: 'usr_mg_01',
    name: 'Елена Ковалева',
    email: 'manager@fulfillment.ru',
    username: 'manager',
    role: 'manager'
  },
  client: {
    id: 'usr_cl_01',
    name: 'ООО "Модный Гардероб"',
    email: 'seller@fashion-store.ru',
    username: 'client',
    role: 'client',
    clientId: 'cl_9921',
    clientName: 'ООО "Модный Гардероб" (ИНН 7701234567)'
  },
  admin: {
    id: 'usr_ad_01',
    name: 'Иван Администратор',
    email: 'admin@fulfillment.ru',
    username: 'admin',
    role: 'admin'
  }
};

export class AuthService {
  private static config: ApiConfig = AuthService.loadConfig();

  public static loadConfig(): ApiConfig {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!saved) return DEFAULT_API_CONFIG;
    try {
      return { ...DEFAULT_API_CONFIG, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_API_CONFIG;
    }
  }

  public static saveConfig(newConfig: Partial<ApiConfig>): ApiConfig {
    const updated = { ...this.config, ...newConfig };
    this.config = updated;
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
    return updated;
  }

  public static getConfig(): ApiConfig {
    return { ...this.config };
  }

  public static getStoredUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEY_USER);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  public static getStoredToken(): string | null {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  }

  public static saveSession(user: User, token: string): void {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
  }

  public static clearSession(): void {
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  }

  /**
   * Выполнение входа в систему (Мок либо реальный запрос к бэкенду)
   */
  public static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (this.config.useMock) {
      return this.mockLogin(credentials);
    } else {
      return this.realLogin(credentials);
    }
  }

  private static async mockLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    // Небольшая задержка для имитации сетевого запроса
    await new Promise((resolve) => setTimeout(resolve, 600));

    const role = credentials.role || (credentials.username in MOCK_USERS ? credentials.username : 'operator');
    const user = MOCK_USERS[role] || {
      id: `usr_${Date.now()}`,
      name: credentials.username,
      email: `${credentials.username}@fulfillment.ru`,
      username: credentials.username,
      role: 'operator'
    };

    const token = `mock_jwt_token_${user.role}_${Date.now()}`;
    this.saveSession(user, token);

    return {
      user,
      tokens: { accessToken: token, expiresIn: 3600 }
    };
  }

  private static async realLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Ошибка сервера: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Бэкенд должен вернуть { user: User, tokens: { accessToken: string } }
      const user: User = data.user || data.data?.user;
      const accessToken: string = data.tokens?.accessToken || data.token || data.access_token;

      if (!user || !accessToken) {
        throw new Error('Некорректный формат ответа бэкенда. Ожидались user и accessToken.');
      }

      this.saveSession(user, accessToken);
      return { user, tokens: { accessToken } };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Превышено время ожидания ответа бэкенда (${this.config.timeoutMs} мс). Проверьте URL: ${this.config.baseUrl}`);
      }
      throw err;
    }
  }

  /**
   * Проверка текущей сессии (GET /auth/me)
   */
  public static async fetchMe(): Promise<User | null> {
    if (this.config.useMock) {
      return this.getStoredUser();
    }

    const token = this.getStoredToken();
    if (!token) return null;

    try {
      const response = await fetch(`${this.config.baseUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        this.clearSession();
        return null;
      }

      const data = await response.json();
      const user = data.user || data;
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      return user;
    } catch {
      return this.getStoredUser();
    }
  }
}
