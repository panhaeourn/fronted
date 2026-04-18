import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMe, logoutRequest, type AuthUser } from "./auth";

type AuthContextValue = {
  me: AuthUser | null;
  loading: boolean;
  refreshMe: (options?: { silent?: boolean }) => Promise<AuthUser | null>;
  setMe: (user: AuthUser | null) => void;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isReceptionist: boolean;
  isUser: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;

    if (!silent) {
      setLoading(true);
    }

    try {
      const nextUser = await getMe();
      setMe(nextUser);
      return nextUser;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refreshMe();

    const handleFocus = () => {
      void refreshMe({ silent: true });
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshMe]);

  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Clear client state even if backend logout fails.
    } finally {
      setMe(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      me,
      loading,
      refreshMe,
      setMe,
      signOut,
      isAdmin: me?.role === "ADMIN",
      isReceptionist: me?.role === "RECEPTIONIST",
      isUser: me?.role === "USER",
    }),
    [loading, me, refreshMe, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
