-- Add status, canceled_reason, and canceled_at columns to plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS canceled_reason TEXT,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP;

-- Create index on status column
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);
