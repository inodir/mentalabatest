import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from "react";
import {
  dtmLogin,
  dtmLogout,
  dtmFetchMe,
  getDTMTokens,
  clearDTMTokens,
  type DTMUserData,
} from "@/lib/dtm-auth";
import { startInactivityWatch, stopInactivityWatch } from "@/lib/security";

type AppRole = "super_admin" | "school_admin" | "district_admin" | null;

function mapDTMRole(role: DTMUserData["role"]): AppRole {
  switch (role) {
    case "school": return "school_admin";
    case "district": return "district_admin";
    case "admin":
    case "superadmin": return "super_admin";
    default: return null;
  }
}

interface AuthContextType {
  user: { id: string } | null;
  role: AppRole;
  schoolId: string | null;
  district: string | null;
  loading: boolean;
  dtmUser: DTMUserData | null;
  sessionWarning: boolean;
  setSessionWarning: (val: boolean) => void;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  lastSynced: Date | null;
  refreshing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [dtmUser, setDtmUser] = useState<DTMUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const applyDTMUser = useCallback((userData: DTMUserData) => {
    setDtmUser(userData);
    setRole(mapDTMRole(userData.role));
    setDistrict(userData.district);
    setSchoolId(userData.school?.code ?? null);
    setUser({ id: `dtm_${userData.id}` });
    setLastSynced(new Date());
  }, []);

  const clearState = useCallback(() => {
    setUser(null);
    setRole(null);
    setSchoolId(null);
    setDistrict(null);
    setDtmUser(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { accessToken } = getDTMTokens();
        if (accessToken) {
          const dtmData = await dtmFetchMe();
          if (isMounted && dtmData) {
            applyDTMUser(dtmData);
          } else if (isMounted) {
            clearDTMTokens();
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [applyDTMUser]);

  // Start/stop inactivity watcher when user logs in/out
  useEffect(() => {
    if (user) {
      startInactivityWatch(
        async () => {
          await dtmLogout();
          clearState();
          window.location.href = "/";
        },
        () => setSessionWarning(true)
      );
    } else {
      stopInactivityWatch();
    }
    return () => stopInactivityWatch();
  }, [user, clearState]);

  const signIn = async (username: string, password: string) => {
    const result = await dtmLogin(username, password);
    if (result.error) {
      return { error: result.error };
    }
    applyDTMUser(result.userData);
    return { error: null };
  };

  const signOut = async () => {
    await dtmLogout();
    clearState();

    // Clear cached data
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith("school_dashboard_") ||
        key.startsWith("school_dtm_data_") ||
        key === "school_dtm_code" ||
        key === "dtm_school_stats"
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  };
  const refresh = useCallback(async () => {
    try {
      const { accessToken } = getDTMTokens();
      if (accessToken) {
        setRefreshing(true);
        const dtmData = await dtmFetchMe();
        if (dtmData) {
          applyDTMUser(dtmData);
        }
      }
    } catch (err) {
      console.error("Profile refresh failed", err);
    } finally {
      setRefreshing(false);
    }
  }, [applyDTMUser]);

  return (
    <AuthContext.Provider
      value={{ user, role, schoolId, district, loading, dtmUser, sessionWarning, setSessionWarning, signIn, signOut, refresh, lastSynced, refreshing }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
