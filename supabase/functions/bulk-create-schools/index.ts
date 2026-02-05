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
 
     const results: ImportResult[] = [];
 
     for (const school of schools) {
       try {
         // Validate required fields
         if (!school.region || !school.district || !school.school_name || 
             !school.school_code || !school.admin_full_name || !school.admin_login) {
           results.push({
             success: false,
             school_code: school.school_code || "N/A",
             school_name: school.school_name || "N/A",
             admin_login: school.admin_login || "N/A",
             error: "Barcha maydonlar to'ldirilishi shart",
           });
           continue;
         }
 
         // Check if school_code already exists
         const { data: existingSchool } = await supabase
           .from("schools")
           .select("id")
           .eq("school_code", school.school_code)
           .single();
 
         if (existingSchool) {
           results.push({
             success: false,
             school_code: school.school_code,
             school_name: school.school_name,
             admin_login: school.admin_login,
             error: "Bu maktab kodi allaqachon mavjud",
           });
           continue;
         }
 
         // Generate password
         const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
         let password = "";
         for (let i = 0; i < 12; i++) {
           password += chars.charAt(Math.floor(Math.random() * chars.length));
         }
 
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
           results.push({
             success: false,
             school_code: school.school_code,
             school_name: school.school_name,
             admin_login: school.admin_login,
             error: schoolError.message,
           });
           continue;
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
           // Rollback school creation
           await supabase.from("schools").delete().eq("id", schoolData.id);
           results.push({
             success: false,
             school_code: school.school_code,
             school_name: school.school_name,
             admin_login: school.admin_login,
             error: userError.message,
           });
           continue;
         }
 
         // Create profile
         await supabase.from("profiles").insert({
           user_id: userData.user.id,
           full_name: school.admin_full_name,
           school_id: schoolData.id,
         });
 
         // Create user role
         await supabase.from("user_roles").insert({
           user_id: userData.user.id,
           role: "school_admin",
         });
 
        // Store initial password for export purposes
        await supabase.from("school_admin_credentials").upsert({
          school_id: schoolData.id,
          admin_login: school.admin_login,
          initial_password: password,
        });

         results.push({
           success: true,
           school_code: school.school_code,
           school_name: school.school_name,
           admin_login: school.admin_login,
           password,
         });
       } catch (err) {
         results.push({
           success: false,
           school_code: school.school_code || "N/A",
           school_name: school.school_name || "N/A",
           admin_login: school.admin_login || "N/A",
           error: err instanceof Error ? err.message : "Noma'lum xato",
         });
       }
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