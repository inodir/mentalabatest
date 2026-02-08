
-- Step 1: Add district_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'district_admin';

-- Step 2: Add district column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district text;

-- Step 3: Create get_user_district security definer function
CREATE OR REPLACE FUNCTION public.get_user_district(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT district
    FROM public.profiles
    WHERE user_id = _user_id
$$;

-- Step 4: Create district_admin_credentials table
CREATE TABLE IF NOT EXISTS public.district_admin_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district text NOT NULL,
  region text NOT NULL,
  admin_login text NOT NULL,
  admin_full_name text NOT NULL,
  initial_password text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.district_admin_credentials ENABLE ROW LEVEL SECURITY;
