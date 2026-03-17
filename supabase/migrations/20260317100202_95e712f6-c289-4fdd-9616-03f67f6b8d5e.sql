
-- Add show_results column to schools table (default true - results visible)
ALTER TABLE public.schools ADD COLUMN show_results boolean NOT NULL DEFAULT true;
