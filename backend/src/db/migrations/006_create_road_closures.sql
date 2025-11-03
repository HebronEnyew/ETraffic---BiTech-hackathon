-- Road closures linked to events
CREATE TABLE IF NOT EXISTS road_closures (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL,
  road_name VARCHAR(255) NOT NULL,
  start_latitude DECIMAL(10, 8) NOT NULL,
  start_longitude DECIMAL(11, 8) NOT NULL,
  end_latitude DECIMAL(10, 8) NOT NULL,
  end_longitude DECIMAL(11, 8) NOT NULL,
  closure_start DATETIME NOT NULL,
  closure_end DATETIME NOT NULL,
  alternate_route_description TEXT,
  severity ENUM('partial', 'full') DEFAULT 'full',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_event (event_id),
  INDEX idx_dates (closure_start, closure_end),
  INDEX idx_start_location (start_latitude, start_longitude),
  INDEX idx_end_location (end_latitude, end_longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

