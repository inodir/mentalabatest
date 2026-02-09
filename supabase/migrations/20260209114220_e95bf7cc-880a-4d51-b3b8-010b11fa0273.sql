
-- Fix district_admin_credentials RLS: currently has TWO RESTRICTIVE policies and ZERO PERMISSIVE.
-- PostgreSQL denies all access when no PERMISSIVE policy exists, regardless of RESTRICTIVE policies.
-- Fix: Make super_admin policy PERMISSIVE so super_admins can access, keep anonymous deny as RESTRICTIVE.

-- Drop existing broken policies
DROP POLICY IF EXISTS "Deny anonymous access to district credentials" ON public.district_admin_credentials;
DROP POLICY IF EXISTS "Super admins can manage district credentials" ON public.district_admin_credentials;

-- Create RESTRICTIVE policy to deny anonymous access
CREATE POLICY "Deny anonymous access to district credentials"
ON public.district_admin_credentials
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create PERMISSIVE policy for super admins (required for any access to work)
CREATE POLICY "Super admins can manage district credentials"
ON public.district_admin_credentials
AS PERMISSIVE
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
