import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from "react";
import {
  dtmLogin,
  dtmLogout,
  dtmFetchMe,
  getDTMTokens,
  clearDTMTokens,
  type DTMUserData,
} from "@/lib/dtm-auth";

type AppRole = "super_admin" | "school_admin" | "district_admin" | null;

function mapDTMRole(role: DTMUserData["role"]): AppRole {
  switch (role) {
    case "school": return "school_admin";
    case "district": return "district_admin";
    case "admin": return "super_admin";
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
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [dtmUser, setDtmUser] = useState<DTMUserData | null>(null);
  const [loading, setLoading] = useState(true);

  const applyDTMUser = useCallback((userData: DTMUserData) => {
    setDtmUser(userData);
    setRole(mapDTMRole(userData.role));
    setDistrict(userData.district);
    setSchoolId(userData.school?.code ?? null);
    setUser({ id: `dtm_${userData.id}` });
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

  return (
    <AuthContext.Provider
      value={{ user, role, schoolId, district, loading, dtmUser, signIn, signOut }}
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
