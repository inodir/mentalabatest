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
      return new Response(JSON.stringify({ error: 'Only super admins can reset passwords' }), { 
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    const { admin_login, new_password } = await req.json()
    
    // Validate inputs
    const errors: string[] = [];
    const loginErr = validateLogin(admin_login);
    if (loginErr) errors.push(loginErr);
    const passErr = validatePassword(new_password);
    if (passErr) errors.push(passErr);

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: errors.join('; ') }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    // Find the user by email (admin_login@mentalaba.uz)
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      return new Response(JSON.stringify({ error: 'Failed to list users' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    const targetEmail = `${admin_login}@mentalaba.uz`
    const targetUser = users.users.find(u => u.email === targetEmail)
    
    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), { 
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    // Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { password: new_password }
    )
    
    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to update password' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Password reset successfully'
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
    
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
