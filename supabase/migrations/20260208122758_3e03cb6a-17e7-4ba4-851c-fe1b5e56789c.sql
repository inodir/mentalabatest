
-- RLS policies for district_admin_credentials
CREATE POLICY "Deny anonymous access to district credentials"
ON public.district_admin_credentials
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can manage district credentials"
ON public.district_admin_credentials
AS RESTRICTIVE
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- District admins can view schools in their district
CREATE POLICY "District admins can view their district schools"
ON public.schools
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'district_admin'::app_role) 
  AND district = get_user_district(auth.uid())
);

-- District admins can update schools in their district
CREATE POLICY "District admins can update their district schools"
ON public.schools
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'district_admin'::app_role) 
  AND district = get_user_district(auth.uid())
);

-- District admins can view students in their district's schools
CREATE POLICY "District admins can view their district students"
ON public.students
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'district_admin'::app_role) 
  AND school_id IN (
    SELECT id FROM public.schools WHERE district = get_user_district(auth.uid())
  )
);

-- District admins can manage students in their district's schools
CREATE POLICY "District admins can manage their district students"
ON public.students
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'district_admin'::app_role) 
  AND school_id IN (
    SELECT id FROM public.schools WHERE district = get_user_district(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'district_admin'::app_role) 
  AND school_id IN (
    SELECT id FROM public.schools WHERE district = get_user_district(auth.uid())
  )
);

-- District admins can view test results of their district's students
CREATE POLICY "District admins can view their district test results"
ON public.test_results
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'district_admin'::app_role)
  AND student_id IN (
    SELECT s.id FROM public.students s
    JOIN public.schools sc ON s.school_id = sc.id
    WHERE sc.district = get_user_district(auth.uid())
  )
);

-- District admins can view credentials of school admins in their district
CREATE POLICY "District admins can view their district school credentials"
ON public.school_admin_credentials
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'district_admin'::app_role)
  AND school_id IN (
    SELECT id FROM public.schools WHERE district = get_user_district(auth.uid())
  )
);
