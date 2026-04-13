-- =========================================================
-- STUDENT AUTH SYSTEM DATABASE MIGRATION
-- Run this SQL to add password and authentication fields
-- =========================================================

-- Add authentication columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL AFTER email,
ADD COLUMN IF NOT EXISTS google_uid VARCHAR(255) NULL AFTER password_hash,
ADD COLUMN IF NOT EXISTS has_password BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_google_only BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME NULL,
ADD COLUMN IF NOT EXISTS linked_google BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_login DATETIME NULL,
ADD COLUMN IF NOT EXISTS login_method VARCHAR(20) NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_google_uid ON users(google_uid);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
CREATE INDEX IF NOT EXISTS idx_users_email_role ON users(email, role);

-- Create password_resets table for tracking reset requests
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used BOOLEAN DEFAULT FALSE,
  INDEX idx_password_resets_email (email),
  INDEX idx_password_resets_token (token),
  INDEX idx_password_resets_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create account_links table for tracking Google account links
CREATE TABLE IF NOT EXISTS account_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  google_uid VARCHAR(255) NOT NULL,
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_google_uid (google_uid),
  INDEX idx_account_links_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create pending_google_links table for link verification
CREATE TABLE IF NOT EXISTS pending_google_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  google_uid VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_pending_email (email),
  INDEX idx_pending_google_token (token),
  INDEX idx_pending_google_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create email_verifications table for tracking verification emails
CREATE TABLE IF NOT EXISTS email_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email_verifications_token (token),
  INDEX idx_email_verifications_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create login_logs table for security auditing (optional)
CREATE TABLE IF NOT EXISTS login_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  login_method VARCHAR(20) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  success BOOLEAN DEFAULT TRUE,
  failure_reason VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_login_logs_user_id (user_id),
  INDEX idx_login_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- DEFAULT DATA UPDATES
-- =========================================================

-- Update existing Google users to mark them appropriately
UPDATE users 
SET is_google_only = TRUE, 
    has_password = FALSE,
    email_verified = TRUE
WHERE google_uid IS NOT NULL 
  AND password_hash IS NULL;

-- Update existing password users
UPDATE users 
SET has_password = TRUE,
    is_google_only = FALSE
WHERE password_hash IS NOT NULL;

-- =========================================================
-- VERIFICATION
-- =========================================================

-- Check migration results
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN has_password = TRUE THEN 1 ELSE 0 END) as with_password,
  SUM(CASE WHEN google_uid IS NOT NULL THEN 1 ELSE 0 END) as with_google,
  SUM(CASE WHEN has_password = TRUE AND google_uid IS NOT NULL THEN 1 ELSE 0 END) as with_both
FROM users;
