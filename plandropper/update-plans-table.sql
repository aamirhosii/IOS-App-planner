-- Add new columns to plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS max_participants INTEGER;

-- Create index for category to improve filtering performance
CREATE INDEX IF NOT EXISTS plans_category_idx ON plans(category);
