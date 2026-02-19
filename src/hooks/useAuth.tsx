import { useEffect, useState, createContext, useContext, ReactNode, useRef, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  dtmLogin,
  dtmLogout,
  dtmFetchMe,
  getDTMTokens,
  getDTMUserData,
  clearDTMTokens,
  type DTMUserData,
} from "@/lib/dtm-auth";

type AppRole = "super_admin" | "school_admin" | "district_admin" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole;
  schoolId: string | null;
  district: string | null;
  loading: boolean;
  // DTM auth data
  dtmUser: DTMUserData | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInDTM: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [dtmUser, setDtmUser] = useState<DTMUserData | null>(null);

  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);
  const isSigningIn = useRef(false);

  const fetchUserData = async (userId: string) => {
    const [roleResult, profileResult] = await Promise.all([
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single(),
      supabase
        .from("profiles")
        .select("school_id, district")
        .eq("user_id", userId)
        .maybeSingle()
    ]);

    return {
      role: roleResult.data?.role as AppRole ?? null,
      schoolId: profileResult.data?.school_id ?? null,
      district: profileResult.data?.district ?? null,
    };
  };

  // Set DTM user state and map to auth context fields
  const applyDTMUser = useCallback((userData: DTMUserData) => {
    setDtmUser(userData);
    setRole(userData.role === "school" ? "school_admin" : "district_admin");
    setDistrict(userData.district);
    setSchoolId(userData.school?.code ?? null);
    // Create a minimal "user" object so route guards work
    setUser({ id: `dtm_${userData.id}` } as User);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        if (isSigningIn.current) return;

        setSession(session);
        // Only update Supabase user if no DTM user is active
        if (!getDTMTokens().accessToken) {
          setUser(session?.user ?? null);
        }

        if (initialLoadDone.current && session?.user && !getDTMTokens().accessToken) {
          const userData = await fetchUserData(session.user.id);
          if (isMounted) {
            setRole(userData.role);
            setSchoolId(userData.schoolId);
            setDistrict(userData.district);
          }
        } else if (!session?.user && !getDTMTokens().accessToken) {
          setRole(null);
          setSchoolId(null);
          setDistrict(null);
        }
      }
    );

    const initializeAuth = async () => {
      try {
        // Check DTM tokens first
        const { accessToken } = getDTMTokens();
        if (accessToken) {
          const dtmData = await dtmFetchMe();
          if (isMounted && dtmData) {
            applyDTMUser(dtmData);
            return;
          } else if (isMounted) {
            // DTM tokens expired, clear them
            clearDTMTokens();
          }
        }

        // Fall back to Supabase auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const userData = await fetchUserData(session.user.id);
          if (isMounted) {
            setRole(userData.role);
            setSchoolId(userData.schoolId);
            setDistrict(userData.district);
          }
        }
      } finally {
        if (isMounted) {
          initialLoadDone.current = true;
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applyDTMUser]);

  // Supabase sign in (for super admin)
  const signIn = async (email: string, password: string) => {
    isSigningIn.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error && data.user) {
        const userData = await fetchUserData(data.user.id);
        setUser(data.user);
        setSession(data.session);
        setRole(userData.role);
        setSchoolId(userData.schoolId);
        setDistrict(userData.district);
      }
      return { error: error as Error | null };
    } finally {
      isSigningIn.current = false;
    }
  };

  // DTM API sign in (for school/district admins)
  const signInDTM = async (username: string, password: string) => {
    const result = await dtmLogin(username, password);
    if (result.error) {
      return { error: result.error };
    }
    applyDTMUser(result.userData);
    return { error: null };
  };

  const signOut = async () => {
    // Check if DTM user
    if (getDTMTokens().accessToken || dtmUser) {
      await dtmLogout();
      setDtmUser(null);
      setUser(null);
      setRole(null);
      setSchoolId(null);
      setDistrict(null);
      return;
    }

    // Supabase sign out
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

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setSchoolId(null);
    setDistrict(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, role, schoolId, district, loading, dtmUser, signIn, signInDTM, signOut }}
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
