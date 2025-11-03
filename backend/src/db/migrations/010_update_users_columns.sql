-- Update users table with new columns for photo upload and coins
ALTER TABLE users
  MODIFY COLUMN coins_balance INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS photo_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_trusted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS id_photo_path VARCHAR(512),
  ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);

