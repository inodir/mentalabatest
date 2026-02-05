 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
interface SchoolData {
  region: string;
  district: string;
  school_name: string;
  school_code: string;
  admin_full_name: string;
  admin_login: string;
  password?: string; // Optional - will be auto-generated if not provided
}
 
 interface ImportResult {
   success: boolean;
   school_code: string;
   school_name: string;
   admin_login: string;
   password?: string;
   error?: string;
 }
 
 Deno.serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, serviceRoleKey, {
       auth: { autoRefreshToken: false, persistSession: false }
     });
 
     const { schools } = await req.json() as { schools: SchoolData[] };
 
     if (!schools || !Array.isArray(schools) || schools.length === 0) {
       throw new Error("schools array is required");
     }
 
      // Process schools in parallel batches
      const BATCH_SIZE = 5;
      const results: ImportResult[] = [];

      // Helper to generate password
      const generatePassword = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        let password = "";
        for (let i = 0; i < 12; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
      };

      // Process single school
      const processSchool = async (school: SchoolData): Promise<ImportResult> => {
        try {
          // Validate required fields
          if (!school.region || !school.district || !school.school_name || 
              !school.school_code || !school.admin_full_name || !school.admin_login) {
            return {
              success: false,
              school_code: school.school_code || "N/A",
              school_name: school.school_name || "N/A",
              admin_login: school.admin_login || "N/A",
              error: "Barcha maydonlar to'ldirilishi shart",
            };
          }

          // Check if school_code already exists
          const { data: existingSchool } = await supabase
            .from("schools")
            .select("id")
            .eq("school_code", school.school_code)
            .single();

          if (existingSchool) {
            return {
              success: false,
              school_code: school.school_code,
              school_name: school.school_name,
              admin_login: school.admin_login,
              error: "Bu maktab kodi allaqachon mavjud",
            };
          }

          const password = school.password?.trim() || generatePassword();

          // Create school record
          const { data: schoolData, error: schoolError } = await supabase
            .from("schools")
            .insert({
              region: school.region,
              district: school.district,
              school_name: school.school_name,
              school_code: school.school_code,
              admin_full_name: school.admin_full_name,
              admin_login: school.admin_login,
            })
            .select()
            .single();

          if (schoolError) {
            return {
              success: false,
              school_code: school.school_code,
              school_name: school.school_name,
              admin_login: school.admin_login,
              error: schoolError.message,
            };
          }

          // Create admin user
          const email = `${school.admin_login}@mentalaba.uz`;
          const { data: userData, error: userError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: school.admin_full_name },
          });

          if (userError) {
            await supabase.from("schools").delete().eq("id", schoolData.id);
            return {
              success: false,
              school_code: school.school_code,
              school_name: school.school_name,
              admin_login: school.admin_login,
              error: userError.message,
            };
          }

          // Create profile and role in parallel
          await Promise.all([
            supabase.from("profiles").insert({
              user_id: userData.user.id,
              full_name: school.admin_full_name,
              school_id: schoolData.id,
            }),
            supabase.from("user_roles").insert({
              user_id: userData.user.id,
              role: "school_admin",
            }),
            supabase.from("school_admin_credentials").upsert({
              school_id: schoolData.id,
              admin_login: school.admin_login,
              initial_password: password,
            }),
          ]);

          return {
            success: true,
            school_code: school.school_code,
            school_name: school.school_name,
            admin_login: school.admin_login,
            password,
          };
        } catch (err) {
          return {
            success: false,
            school_code: school.school_code || "N/A",
            school_name: school.school_name || "N/A",
            admin_login: school.admin_login || "N/A",
            error: err instanceof Error ? err.message : "Noma'lum xato",
          };
        }
      };

      // Process in batches
      for (let i = 0; i < schools.length; i += BATCH_SIZE) {
        const batch = schools.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(processSchool));
        results.push(...batchResults);
      }
 
     return new Response(JSON.stringify({ results }), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
       status: 200,
     });
   } catch (error) {
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
     );
   }
 });