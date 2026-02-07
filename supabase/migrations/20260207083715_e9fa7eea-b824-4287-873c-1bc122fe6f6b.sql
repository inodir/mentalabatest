
-- Add password_changed flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN password_changed BOOLEAN NOT NULL DEFAULT false;

-- Set existing super_admin profiles as already changed (they don't use initial passwords)
UPDATE public.profiles 
SET password_changed = true 
WHERE user_id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'super_admin'
);
