-- Create plan_analytics table to track visits and interactions
CREATE TABLE IF NOT EXISTS plan_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id VARCHAR(255) NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  visitor_ip VARCHAR(45), -- To track anonymous visitors (IPv4 or IPv6)
  visit_type VARCHAR(20) NOT NULL, -- 'view', 'click', 'request', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  session_id VARCHAR(255) -- To group interactions in a single session
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS plan_analytics_plan_id_idx ON plan_analytics(plan_id);
CREATE INDEX IF NOT EXISTS plan_analytics_user_id_idx ON plan_analytics(user_id);
CREATE INDEX IF NOT EXISTS plan_analytics_created_at_idx ON plan_analytics(created_at);
CREATE INDEX IF NOT EXISTS plan_analytics_visit_type_idx ON plan_analytics(visit_type);

-- Add hotness_score column to plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS hotness_score FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unique_view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_calculated_at TIMESTAMP WITH TIME ZONE;

-- Create index for hotness_score for efficient sorting
CREATE INDEX IF NOT EXISTS plans_hotness_score_idx ON plans(hotness_score DESC);
