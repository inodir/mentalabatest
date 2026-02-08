
-- Fix 1: Add RESTRICTIVE anonymous deny on school_admin_credentials (defense-in-depth)
CREATE POLICY "Deny anonymous access to credentials"
ON public.school_admin_credentials
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix 2: Add explicit write policies on test_results for super_admins
-- INSERT
CREATE POLICY "Super admins can insert test results"
ON public.test_results
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- UPDATE
CREATE POLICY "Super admins can update test results"
ON public.test_results
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- DELETE
CREATE POLICY "Super admins can delete test results"
ON public.test_results
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Also add RESTRICTIVE anonymous deny on test_results (defense-in-depth)
CREATE POLICY "Deny anonymous access to test results"
ON public.test_results
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
