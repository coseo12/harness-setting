'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@/lib/types';
import { registerUser, loginUser } from '@/lib/api-client';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (user: User, token: string) => void;
  logout: () => void;
  guestLogin: (nickname: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  guestLogin: async () => {},
});

const TOKEN_KEY = 'chat-app-token';
const USER_KEY = 'chat-app-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  // 초기 로드: localStorage에서 복원
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setState({ user, token, loading: false });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setState({ user: null, token: null, loading: false });
      }
    } else {
      setState({ user: null, token: null, loading: false });
    }
  }, []);

  const login = useCallback((user: User, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ user, token, loading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, token: null, loading: false });
  }, []);

  // 게스트 로그인: 회원가입 시도 → 실패 시 로그인
  const guestLogin = useCallback(async (nickname: string) => {
    const GUEST_PASSWORD = 'guest-password';
    const email = `${nickname.toLowerCase().replace(/\s/g, '-')}@guest.local`;

    try {
      const data = await registerUser(email, GUEST_PASSWORD, nickname);
      login(data.user, data.token);
    } catch {
      const data = await loginUser(email, GUEST_PASSWORD);
      login(data.user, data.token);
    }
  }, [login]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, guestLogin }}>
      {children}
    </AuthContext.Provider>
  );
}
