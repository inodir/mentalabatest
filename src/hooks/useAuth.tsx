 import { useEffect, useState, createContext, useContext, ReactNode } from "react";
 import { User, Session } from "@supabase/supabase-js";
 import { supabase } from "@/integrations/supabase/client";
 import { useNavigate } from "react-router-dom";
 
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
 
   useEffect(() => {
     // Set up auth state listener BEFORE getting session
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       async (event, session) => {
         setSession(session);
         setUser(session?.user ?? null);
 
         if (session?.user) {
           // Fetch user role and school
           setTimeout(async () => {
             const { data: roleData } = await supabase
               .from("user_roles")
               .select("role")
               .eq("user_id", session.user.id)
               .single();
 
             if (roleData) {
               setRole(roleData.role as AppRole);
             }
 
             const { data: profileData } = await supabase
               .from("profiles")
               .select("school_id")
               .eq("user_id", session.user.id)
               .single();
 
             if (profileData) {
               setSchoolId(profileData.school_id);
             }
           }, 0);
         } else {
           setRole(null);
           setSchoolId(null);
         }
         setLoading(false);
       }
     );
 
     // Get initial session
     supabase.auth.getSession().then(({ data: { session } }) => {
       setSession(session);
       setUser(session?.user ?? null);
       if (!session) setLoading(false);
     });
 
     return () => {
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