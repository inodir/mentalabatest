import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation helpers
function validateLogin(login: string): string | null {
  if (!login || login.length < 3 || login.length > 50) return 'Login 3-50 belgi bo\'lishi kerak';
  if (!/^[a-zA-Z0-9_-]+$/.test(login)) return 'Login faqat harf, raqam, _ va - belgilardan iborat bo\'lishi kerak';
  return null;
}

function validateTextField(value: string, fieldName: string, maxLen = 200): string | null {
  if (!value || value.trim().length === 0) return `${fieldName} bo'sh bo'lmasligi kerak`;
  if (value.length > maxLen) return `${fieldName} ${maxLen} belgidan oshmasligi kerak`;
  return null;
}

function sanitizeText(value: string): string {
  return value.replace(/[<>"']/g, '').trim();
}

interface SchoolData {
  region: string;
  district: string;
  school_name: string;
  school_code: string;
  admin_full_name: string;
  admin_login: string;
  password?: string;
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: 'Only super admins can bulk create schools' }), { 
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { schools } = await req.json() as { schools: SchoolData[] };

    if (!schools || !Array.isArray(schools) || schools.length === 0) {
      return new Response(JSON.stringify({ error: "schools array is required" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (schools.length > 100) {
      return new Response(JSON.stringify({ error: 'Maximum 100 schools per request' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const BATCH_SIZE = 5;
    const results: ImportResult[] = [];

    const generatePassword = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
      let password = "";
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const processSchool = async (school: SchoolData): Promise<ImportResult> => {
      try {
        // Validate all fields
        const validationErrors: string[] = [];
        const regionErr = validateTextField(school.region, 'Viloyat');
        if (regionErr) validationErrors.push(regionErr);
        const districtErr = validateTextField(school.district, 'Tuman');
        if (districtErr) validationErrors.push(districtErr);
        const nameErr = validateTextField(school.school_name, 'Maktab nomi');
        if (nameErr) validationErrors.push(nameErr);
        const codeErr = validateTextField(school.school_code, 'Maktab kodi', 50);
        if (codeErr) validationErrors.push(codeErr);
        const fullNameErr = validateTextField(school.admin_full_name, 'Admin ismi');
        if (fullNameErr) validationErrors.push(fullNameErr);
        const loginErr = validateLogin(school.admin_login);
        if (loginErr) validationErrors.push(loginErr);

        if (validationErrors.length > 0) {
          return {
            success: false,
            school_code: school.school_code || "N/A",
            school_name: school.school_name || "N/A",
            admin_login: school.admin_login || "N/A",
            error: validationErrors.join('; '),
          };
        }

        const cleanRegion = sanitizeText(school.region);
        const cleanDistrict = sanitizeText(school.district);
        const cleanName = sanitizeText(school.school_name);
        const cleanCode = sanitizeText(school.school_code);
        const cleanAdminName = sanitizeText(school.admin_full_name);

        // Check if school_code already exists
        const { data: existingSchool } = await supabase
          .from("schools")
          .select("id")
          .eq("school_code", cleanCode)
          .single();

        if (existingSchool) {
          return {
            success: false,
            school_code: cleanCode,
            school_name: cleanName,
            admin_login: school.admin_login,
            error: "Bu maktab kodi allaqachon mavjud",
          };
        }

        const password = school.password?.trim() || generatePassword();

        const { data: schoolData, error: schoolError } = await supabase
          .from("schools")
          .insert({
            region: cleanRegion,
            district: cleanDistrict,
            school_name: cleanName,
            school_code: cleanCode,
            admin_full_name: cleanAdminName,
            admin_login: school.admin_login,
          })
          .select()
          .single();

        if (schoolError) {
          return {
            success: false,
            school_code: cleanCode,
            school_name: cleanName,
            admin_login: school.admin_login,
            error: schoolError.message,
          };
        }

        const email = `${school.admin_login}@mentalaba.uz`;
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: cleanAdminName },
        });

        if (userError) {
          await supabase.from("schools").delete().eq("id", schoolData.id);
          return {
            success: false,
            school_code: cleanCode,
            school_name: cleanName,
            admin_login: school.admin_login,
            error: userError.message,
          };
        }

        await Promise.all([
          supabase.from("profiles").insert({
            user_id: userData.user.id,
            full_name: cleanAdminName,
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
          school_code: cleanCode,
          school_name: cleanName,
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
      JSON.stringify({ error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
