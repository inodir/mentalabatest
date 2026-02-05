-- Update max_score default to 189 (11+11+11+93+63)
ALTER TABLE public.test_results
ALTER COLUMN max_score SET DEFAULT 189;

-- Add comment explaining score breakdown
COMMENT ON COLUMN public.test_results.max_score IS 'Maximum score: 189 (Ona tili: 11, Matematika: 11, Tarix: 11, 1-fan: 93, 2-fan: 63)';