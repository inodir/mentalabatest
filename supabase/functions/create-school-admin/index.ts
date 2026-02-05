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
       return new Response(JSON.stringify({ error: 'Only super admins can create school admins' }), { 
         status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
       })
     }
     
     const { school_id, admin_login, admin_password, admin_full_name } = await req.json()
     
     if (!school_id || !admin_login || !admin_password || !admin_full_name) {
       return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
         status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
       })
     }
     
     // Create auth user for school admin
     const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
       email: `${admin_login}@mentalaba.uz`,
       password: admin_password,
       email_confirm: true,
       user_metadata: { full_name: admin_full_name, is_school_admin: true }
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
         full_name: admin_full_name,
         school_id: school_id
       })
     
     if (profileError) {
       // Rollback: delete the auth user
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
       // Rollback
       await supabaseAdmin.from('profiles').delete().eq('user_id', newUserId)
       await supabaseAdmin.auth.admin.deleteUser(newUserId)
       return new Response(JSON.stringify({ error: roleInsertError.message }), { 
         status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
       })
     }
     
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