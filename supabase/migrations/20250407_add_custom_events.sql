
-- Add new columns to learning_topics table for custom events
ALTER TABLE learning_topics ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
ALTER TABLE learning_topics ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE;
