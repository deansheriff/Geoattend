import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as apiLogin, logout as apiLogout, me as apiMe, User } from "../api/auth";

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const current = await apiMe();
      setUser(current as User);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (email: string, password: string) => {
    const logged = await apiLogin(email, password);
    setUser(logged);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, logout, refresh }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthContext missing");
  return ctx;
}