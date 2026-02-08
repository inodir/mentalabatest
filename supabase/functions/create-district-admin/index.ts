import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const authHeader = req.headers.get('Authorization')!
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
    
    if (!district || !region || !admin_login || !admin_password || !admin_full_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    // Create auth user for district admin
    const email = `${admin_login}@mentalaba.uz`
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: admin_password,
      email_confirm: true,
      user_metadata: { full_name: admin_full_name, is_district_admin: true }
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
          full_name: admin_full_name,
          district: district,
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
          district,
          region,
          admin_login,
          admin_full_name,
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
