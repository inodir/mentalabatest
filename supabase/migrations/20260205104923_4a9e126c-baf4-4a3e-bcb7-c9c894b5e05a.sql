-- Add mandatory subject scores to test_results
ALTER TABLE public.test_results
ADD COLUMN score_ona_tili integer NOT NULL DEFAULT 0,
ADD COLUMN score_matematika integer NOT NULL DEFAULT 0,
ADD COLUMN score_tarix integer NOT NULL DEFAULT 0;

-- Update max_score default to 500 (5 subjects * 100 each)
ALTER TABLE public.test_results
ALTER COLUMN max_score SET DEFAULT 500;

-- Update total_score to be computed from all 5 subjects
COMMENT ON COLUMN public.test_results.total_score IS 'Sum of all 5 subject scores: ona_tili + matematika + tarix + subject1 + subject2';