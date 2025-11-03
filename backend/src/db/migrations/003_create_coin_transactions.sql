-- Coin transactions table
CREATE TABLE IF NOT EXISTS coin_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  transaction_type ENUM('earned', 'converted', 'bonus', 'penalty') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  birr_amount DECIMAL(10, 2),
  exchange_rate DECIMAL(10, 4),
  incident_id INT,
  description TEXT,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_type (transaction_type),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

