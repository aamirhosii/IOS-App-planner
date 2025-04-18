-- Add new columns to plan_analytics table for improved tracking
ALTER TABLE plan_analytics 
ADD COLUMN IF NOT EXISTS is_creator_view BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_potential_spam BOOLEAN DEFAULT FALSE;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS plan_analytics_is_creator_view_idx ON plan_analytics(is_creator_view);
CREATE INDEX IF NOT EXISTS plan_analytics_is_potential_spam_idx ON plan_analytics(is_potential_spam);

-- Add suspicious activity flag to plans table
ALTER TABLE plans
ADD COLUMN IF NOT EXISTS suspicious_activity_detected BOOLEAN DEFAULT FALSE;

-- Create index for suspicious activity
CREATE INDEX IF NOT EXISTS plans_suspicious_activity_idx ON plans(suspicious_activity_detected);

-- Create a view for analytics dashboard (for future use)
CREATE OR REPLACE VIEW plan_analytics_summary AS
SELECT 
 p.id as plan_id,
 p.title,
 p.user_id as creator_id,
 p.created_at as plan_created_at,
 COUNT(CASE WHEN pa.is_creator_view = FALSE AND pa.is_potential_spam = FALSE THEN 1 END) as legitimate_views,
 COUNT(CASE WHEN pa.is_creator_view = TRUE THEN 1 END) as creator_views,
 COUNT(CASE WHEN pa.is_potential_spam = TRUE THEN 1 END) as suspicious_views,
 COUNT(DISTINCT CASE WHEN pa.is_creator_view = FALSE AND pa.is_potential_spam = FALSE THEN 
   COALESCE(pa.user_id, pa.visitor_ip) 
 END) as unique_legitimate_viewers,
 p.hotness_score,
 p.suspicious_activity_detected
FROM 
 plans p
LEFT JOIN 
 plan_analytics pa ON p.id = pa.plan_id
WHERE 
 p.canceled_at IS NULL
GROUP BY 
 p.id, p.title, p.user_id, p.created_at, p.hotness_score, p.suspicious_activity_detected;
