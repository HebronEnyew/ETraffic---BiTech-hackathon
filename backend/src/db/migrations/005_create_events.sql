-- Calendar events and road closures
CREATE TABLE IF NOT EXISTS events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_type ENUM('holiday', 'cultural_ceremony', 'road_closure', 'scheduled_event') NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_am VARCHAR(255),
  description_en TEXT,
  description_am TEXT,
  event_date DATE NOT NULL,
  ethiopian_date VARCHAR(50),
  start_time TIME,
  end_time TIME,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern VARCHAR(100),
  affected_area VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_date (event_date),
  INDEX idx_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

