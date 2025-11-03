-- Update incidents table for photos and coins
ALTER TABLE incidents
  MODIFY COLUMN coins_awarded INT DEFAULT 0;

-- Create incident_photos table
CREATE TABLE IF NOT EXISTS incident_photos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  incident_id INT NOT NULL,
  photo_path VARCHAR(512) NOT NULL,
  photo_type VARCHAR(50),
  file_size INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  INDEX idx_incident (incident_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

