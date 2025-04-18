-- Add time-based hotness score columns to plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS daily_hotness_score FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_hotness_score FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_hotness_score FLOAT DEFAULT 0;

-- Create indexes for efficient sorting
CREATE INDEX IF NOT EXISTS plans_daily_hotness_score_idx ON plans(daily_hotness_score DESC);
CREATE INDEX IF NOT EXISTS plans_weekly_hotness_score_idx ON plans(weekly_hotness_score DESC);
CREATE INDEX IF NOT EXISTS plans_monthly_hotness_score_idx ON plans(monthly_hotness_score DESC);
