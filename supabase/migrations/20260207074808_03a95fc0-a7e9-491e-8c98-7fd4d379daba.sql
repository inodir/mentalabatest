-- Add explicit RESTRICTIVE policy to deny anonymous access to students table
-- Defense-in-depth: existing policies already require authenticated roles,
-- but this makes the intent explicit and adds an extra layer of protection
CREATE POLICY "Deny anonymous access to students"
ON public.students
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
