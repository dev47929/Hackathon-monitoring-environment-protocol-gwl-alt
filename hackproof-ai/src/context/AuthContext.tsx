import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { AuthenticatedUser } from '../types';
import { getStoredToken, clearStoredToken, setStoredToken } from '../services/api';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  login: (user: AuthenticatedUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(() => {
    const token = getStoredToken();
    if (!token) return null;
    const saved = localStorage.getItem('hackproof_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (authenticatedUser: AuthenticatedUser, token: string) => {
    setStoredToken(token);
    localStorage.setItem('hackproof_user', JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
  };

  const logout = () => {
    localStorage.removeItem('hackproof_user');
    clearStoredToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
