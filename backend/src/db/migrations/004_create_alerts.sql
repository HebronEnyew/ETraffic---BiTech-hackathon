-- Alerts and notifications table
CREATE TABLE IF NOT EXISTS alerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  incident_id INT,
  alert_type ENUM('incident', 'congestion', 'road_closure', 'event') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  radius_meters INT DEFAULT 5000,
  severity ENUM('low', 'medium', 'high') DEFAULT 'medium',
  is_read BOOLEAN DEFAULT FALSE,
  read_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_location (latitude, longitude),
  INDEX idx_type (alert_type),
  INDEX idx_read (is_read),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

