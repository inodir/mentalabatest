-- Create table to store initial admin passwords (for export purposes only)
-- Note: This stores initial passwords - should be changed after first login in production

CREATE TABLE public.school_admin_credentials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    admin_login TEXT NOT NULL,
    initial_password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(school_id)
);

-- Enable RLS
ALTER TABLE public.school_admin_credentials ENABLE ROW LEVEL SECURITY;

-- Only super admins can view credentials
CREATE POLICY "Super admins can manage credentials"
ON public.school_admin_credentials
FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));