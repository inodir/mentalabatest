import { useEffect, useState, createContext, useContext, ReactNode, useRef } from "react";
 import { User, Session } from "@supabase/supabase-js";
 import { supabase } from "@/integrations/supabase/client";
 
 type AppRole = "super_admin" | "school_admin" | null;
 
 interface AuthContextType {
   user: User | null;
   session: Session | null;
   role: AppRole;
   schoolId: string | null;
   loading: boolean;
   signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
   signOut: () => Promise<void>;
 }
 
 const AuthContext = createContext<AuthContextType | undefined>(undefined);
 
 export function AuthProvider({ children }: { children: ReactNode }) {
   const [user, setUser] = useState<User | null>(null);
   const [session, setSession] = useState<Session | null>(null);
   const [role, setRole] = useState<AppRole>(null);
   const [schoolId, setSchoolId] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  const fetchUserData = async (userId: string) => {
    const [roleResult, profileResult] = await Promise.all([
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single(),
      supabase
        .from("profiles")
        .select("school_id")
        .eq("user_id", userId)
        .maybeSingle()
    ]);

    return {
      role: roleResult.data?.role as AppRole ?? null,
      schoolId: profileResult.data?.school_id ?? null
    };
  };
 
   useEffect(() => {
    let isMounted = true;

    // Listener for ONGOING auth changes (does NOT control loading after initial load)
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       async (event, session) => {
        if (!isMounted) return;
        
         setSession(session);
         setUser(session?.user ?? null);
 
        // Only handle ongoing changes after initial load is done
        if (initialLoadDone.current && session?.user) {
          const userData = await fetchUserData(session.user.id);
          if (isMounted) {
            setRole(userData.role);
            setSchoolId(userData.schoolId);
          }
         } else {
           setRole(null);
           setSchoolId(null);
         }
       }
     );
 
    // INITIAL load - fetch session and user data before setting loading false
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const userData = await fetchUserData(session.user.id);
          if (isMounted) {
            setRole(userData.role);
            setSchoolId(userData.schoolId);
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
   }, []);
 
   const signIn = async (email: string, password: string) => {
     const { error } = await supabase.auth.signInWithPassword({
       email,
       password,
     });
     return { error: error as Error | null };
   };
 
  const signOut = async () => {
    // Clear cached data on logout to prevent stale data for next user
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith("school_dashboard_") || 
        key.startsWith("school_dtm_data_") ||
        key === "school_dtm_code" ||
        key === "dtm_school_stats" ||
        key === "dtm_api_settings"
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
  };
 
   return (
     <AuthContext.Provider
       value={{ user, session, role, schoolId, loading, signIn, signOut }}
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