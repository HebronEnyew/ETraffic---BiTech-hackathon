-- Users table with Ethiopian National ID (PII - sensitive data)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  ethiopian_national_id VARCHAR(20) UNIQUE NOT NULL COMMENT 'PII - Store securely',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  coins_balance DECIMAL(10, 2) DEFAULT 0,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires DATETIME,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  gps_warnings INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_national_id (ethiopian_national_id),
  INDEX idx_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

