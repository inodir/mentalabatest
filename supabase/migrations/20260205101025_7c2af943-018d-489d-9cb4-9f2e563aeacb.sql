-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'school_admin');

-- Create enum for test languages
CREATE TYPE public.test_language AS ENUM ('uzbek', 'russian', 'english');

-- Create enum for certificate types
CREATE TYPE public.certificate_type AS ENUM ('IELTS', 'CEFR', 'Duolingo', 'TOEFL', 'Other');

-- Create schools table
CREATE TABLE public.schools (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    region TEXT NOT NULL,
    district TEXT NOT NULL,
    school_name TEXT NOT NULL,
    school_code TEXT NOT NULL UNIQUE,
    admin_full_name TEXT NOT NULL,
    admin_login TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create students table
CREATE TABLE public.students (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    test_language test_language NOT NULL DEFAULT 'uzbek',
    subject1 TEXT NOT NULL,
    subject2 TEXT NOT NULL,
    has_language_certificate BOOLEAN NOT NULL DEFAULT false,
    certificate_type certificate_type,
    certificate_score TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test_results table
CREATE TABLE public.test_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    test_language test_language NOT NULL,
    subject1 TEXT NOT NULL,
    subject2 TEXT NOT NULL,
    score_subject1 INTEGER NOT NULL DEFAULT 0,
    score_subject2 INTEGER NOT NULL DEFAULT 0,
    total_score INTEGER NOT NULL DEFAULT 0,
    max_score INTEGER NOT NULL DEFAULT 200,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Create security definer function to get user's school_id
CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT school_id
    FROM public.profiles
    WHERE user_id = _user_id
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Schools policies
CREATE POLICY "Super admins can manage all schools"
ON public.schools FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "School admins can view their own school"
ON public.schools FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'school_admin')
    AND id = public.get_user_school_id(auth.uid())
);

-- Students policies
CREATE POLICY "Super admins can view all students"
ON public.students FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "School admins can manage their own students"
ON public.students FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'school_admin')
    AND school_id = public.get_user_school_id(auth.uid())
);

-- Test results policies
CREATE POLICY "Super admins can view all test results"
ON public.test_results FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "School admins can view their school's test results"
ON public.test_results FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'school_admin')
    AND student_id IN (
        SELECT id FROM public.students 
        WHERE school_id = public.get_user_school_id(auth.uid())
    )
);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_students_school_id ON public.students(school_id);
CREATE INDEX idx_students_full_name ON public.students(full_name);
CREATE INDEX idx_test_results_student_id ON public.test_results(student_id);
CREATE INDEX idx_test_results_test_date ON public.test_results(test_date);
CREATE INDEX idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);