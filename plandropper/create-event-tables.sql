-- Create event_requests table
CREATE TABLE IF NOT EXISTS event_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id VARCHAR(255) NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plan_id, user_id)
);

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id VARCHAR(255) NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plan_id, user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS event_requests_plan_id_idx ON event_requests(plan_id);
CREATE INDEX IF NOT EXISTS event_requests_user_id_idx ON event_requests(user_id);
CREATE INDEX IF NOT EXISTS event_requests_status_idx ON event_requests(status);
CREATE INDEX IF NOT EXISTS event_participants_plan_id_idx ON event_participants(plan_id);
CREATE INDEX IF NOT EXISTS event_participants_user_id_idx ON event_participants(user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER update_event_requests_updated_at
BEFORE UPDATE ON event_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
