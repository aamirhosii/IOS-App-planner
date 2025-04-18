-- Add username column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE;

-- Create index for username to improve lookup performance
CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);
