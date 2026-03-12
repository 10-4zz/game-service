import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren
} from 'react';
import {
  apiGet,
  clearStoredToken,
  getStoredToken,
  loginRequest,
  logoutRequest,
  registerCustomerRequest,
  setStoredToken
} from '../lib/api';
import type { AuthUser, Role } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string, role: Role) => Promise<AuthUser>;
  registerCustomer: (username: string, password: string, displayName: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const me = await apiGet<AuthUser>('/api/me', storedToken);
        setUser(me);
        setToken(storedToken);
      } catch {
        clearStoredToken();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, []);

  async function login(username: string, password: string, role: Role) {
    const result = await loginRequest(username, password, role);
    setStoredToken(result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }

  async function registerCustomer(username: string, password: string, displayName: string) {
    const result = await registerCustomerRequest(username, password, displayName);
    setStoredToken(result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }

  async function logout() {
    const currentToken = getStoredToken();
    try {
      if (currentToken) {
        await logoutRequest(currentToken);
      }
    } catch {
      // Ignore logout request failures and always clear local state.
    } finally {
      clearStoredToken();
      setUser(null);
      setToken(null);
    }
  }

  async function refreshMe() {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setToken(null);
      return;
    }
    const me = await apiGet<AuthUser>('/api/me', currentToken);
    setUser(me);
    setToken(currentToken);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        registerCustomer,
        logout,
        refreshMe
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
