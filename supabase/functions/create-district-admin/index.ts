import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation helpers
function validateLogin(login: string): string | null {
  if (!login || login.length < 3 || login.length > 50) return 'Login 3-50 belgi bo\'lishi kerak';
  if (!/^[a-zA-Z0-9_-]+$/.test(login)) return 'Login faqat harf, raqam, _ va - belgilardan iborat bo\'lishi kerak';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password || password.length < 8 || password.length > 128) return 'Parol 8-128 belgi bo\'lishi kerak';
  return null;
}

function validateTextField(value: string, fieldName: string, maxLen = 100): string | null {
  if (!value || value.trim().length === 0) return `${fieldName} bo'sh bo'lmasligi kerak`;
  if (value.length > maxLen) return `${fieldName} ${maxLen} belgidan oshmasligi kerak`;
  return null;
}

function sanitizeText(value: string): string {
  return value.replace(/[<>"']/g, '').trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    // Verify the requesting user is a super_admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    // Check if user is super_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single()
    
    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: 'Only super admins can create district admins' }), { 
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    const { district, region, admin_login, admin_password, admin_full_name } = await req.json()
    
    // Validate all inputs
    const errors: string[] = [];
    const loginErr = validateLogin(admin_login);
    if (loginErr) errors.push(loginErr);
    const passErr = validatePassword(admin_password);
    if (passErr) errors.push(passErr);
    const nameErr = validateTextField(admin_full_name, 'Ism');
    if (nameErr) errors.push(nameErr);
    const districtErr = validateTextField(district, 'Tuman');
    if (districtErr) errors.push(districtErr);
    const regionErr = validateTextField(region, 'Viloyat');
    if (regionErr) errors.push(regionErr);

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: errors.join('; ') }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const cleanName = sanitizeText(admin_full_name);
    const cleanDistrict = sanitizeText(district);
    const cleanRegion = sanitizeText(region);
    
    // Create auth user for district admin
    const email = `${admin_login}@mentalaba.uz`
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: admin_password,
      email_confirm: true,
      user_metadata: { full_name: cleanName, is_district_admin: true }
    })
    
    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    const newUserId = authData.user.id
    
    // Create profile, role, and credentials in parallel
    const [profileResult, roleResult, credResult] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .insert({
          user_id: newUserId,
          full_name: cleanName,
          district: cleanDistrict,
          password_changed: true,
        }),
      supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: newUserId,
          role: 'district_admin'
        }),
      supabaseAdmin
        .from('district_admin_credentials')
        .insert({
          district: cleanDistrict,
          region: cleanRegion,
          admin_login,
          admin_full_name: cleanName,
          initial_password: admin_password,
        }),
    ])
    
    if (profileResult.error || roleResult.error) {
      // Rollback on failure
      await supabaseAdmin.from('profiles').delete().eq('user_id', newUserId)
      await supabaseAdmin.from('user_roles').delete().eq('user_id', newUserId)
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      const errorMsg = profileResult.error?.message || roleResult.error?.message || 'Unknown error'
      return new Response(JSON.stringify({ error: errorMsg }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      user_id: newUserId,
      message: 'District admin created successfully'
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
