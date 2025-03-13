ALTER TABLE users ADD COLUMN language text NOT NULL DEFAULT 'en';

-- Add comment to explain the column
COMMENT ON COLUMN users.language IS 'The preferred language for meal plan generation. Defaults to English (en).'; 