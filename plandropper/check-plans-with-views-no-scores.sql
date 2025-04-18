-- This query finds plans that have views but no hotness scores
SELECT 
  p.id, 
  p.title, 
  p.view_count, 
  p.unique_view_count, 
  p.hotness_score,
  p.daily_hotness_score,
  p.weekly_hotness_score,
  p.monthly_hotness_score,
  COUNT(pa.id) as analytics_count
FROM 
  plans p
LEFT JOIN 
  plan_analytics pa ON p.id = pa.plan_id
WHERE 
  p.view_count > 0 
  AND (
    p.hotness_score IS NULL OR 
    p.hotness_score = 0 OR
    p.daily_hotness_score IS NULL OR
    p.weekly_hotness_score IS NULL OR
    p.monthly_hotness_score IS NULL
  )
GROUP BY 
  p.id, p.title, p.view_count, p.unique_view_count, p.hotness_score, 
  p.daily_hotness_score, p.weekly_hotness_score, p.monthly_hotness_score
ORDER BY 
  p.view_count DESC;
