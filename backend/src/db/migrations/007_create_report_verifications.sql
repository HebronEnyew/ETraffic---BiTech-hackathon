-- Report verification tracking
CREATE TABLE IF NOT EXISTS report_verifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  incident_id INT NOT NULL,
  verifier_id INT NOT NULL,
  verification_action ENUM('verified', 'rejected', 'false_positive') NOT NULL,
  verification_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  FOREIGN KEY (verifier_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_verification (incident_id, verifier_id),
  INDEX idx_incident (incident_id),
  INDEX idx_verifier (verifier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

