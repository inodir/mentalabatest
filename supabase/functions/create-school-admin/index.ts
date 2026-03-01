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

function validateUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
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
      return new Response(JSON.stringify({ error: 'Only super admins can create school admins' }), { 
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    const { school_id, admin_login, admin_password, admin_full_name } = await req.json()
    
    // Validate all inputs
    const errors: string[] = [];
    if (!school_id || !validateUUID(school_id)) errors.push('school_id UUID formatida bo\'lishi kerak');
    const loginErr = validateLogin(admin_login);
    if (loginErr) errors.push(loginErr);
    const passErr = validatePassword(admin_password);
    if (passErr) errors.push(passErr);
    const nameErr = validateTextField(admin_full_name, 'Ism');
    if (nameErr) errors.push(nameErr);

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: errors.join('; ') }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const cleanName = sanitizeText(admin_full_name);
    
    // Create auth user for school admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: `${admin_login}@mentalaba.uz`,
      password: admin_password,
      email_confirm: true,
      user_metadata: { full_name: cleanName, is_school_admin: true }
    })
    
    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    const newUserId = authData.user.id
    
    // Create profile for the school admin
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: newUserId,
        full_name: cleanName,
        school_id: school_id,
        password_changed: true
      })
    
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return new Response(JSON.stringify({ error: profileError.message }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    // Create user role
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUserId,
        role: 'school_admin'
      })
    
    if (roleInsertError) {
      await supabaseAdmin.from('profiles').delete().eq('user_id', newUserId)
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return new Response(JSON.stringify({ error: roleInsertError.message }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    // Store initial password for export purposes
    await supabaseAdmin
      .from('school_admin_credentials')
      .upsert({
        school_id: school_id,
        admin_login: admin_login,
        initial_password: admin_password
      })
    
    return new Response(JSON.stringify({ 
      success: true, 
      user_id: newUserId,
      message: 'School admin created successfully'
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
