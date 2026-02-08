
-- Fix: Drop the RESTRICTIVE super admin policy and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Super admins can manage district credentials" ON public.district_admin_credentials;

CREATE POLICY "Super admins can manage district credentials"
ON public.district_admin_credentials
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
