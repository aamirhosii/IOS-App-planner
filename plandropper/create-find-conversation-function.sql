-- Function to find a conversation between two users
CREATE OR REPLACE FUNCTION find_conversation_between_users(user_id_1 UUID, user_id_2 UUID)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Find conversations where both users are participants
  SELECT cp1.conversation_id INTO conversation_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = user_id_1 AND cp2.user_id = user_id_2;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;
