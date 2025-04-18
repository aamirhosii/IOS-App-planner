-- Add cost and verify_status columns to plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS verify_status BOOLEAN DEFAULT false;

-- Update existing rows to have default values
UPDATE plans 
SET cost = 0.00, verify_status = false 
WHERE cost IS NULL OR verify_status IS NULL;

-- Add comment to explain the purpose of verify_status
COMMENT ON COLUMN plans.verify_status IS 'Controls plan visibility. When true, plan is verified by admin and visible to users.';
