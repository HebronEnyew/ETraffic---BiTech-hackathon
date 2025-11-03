import pool from './connection';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  try {
    console.log('Seeding database...');

    const hashedPassword = await bcrypt.hash('password123', 12);
    const adminPassword = await bcrypt.hash('admin123', 12);

    // Seed users
    const [users] = await pool.query(`
      INSERT INTO users (email, password_hash, ethiopian_national_id, first_name, last_name, is_verified, is_admin, coins_balance, email_verified)
      VALUES
        ('user@etraffic.test', ?, '1234567890', 'Test', 'User', TRUE, FALSE, 50, TRUE),
        ('admin@etraffic.test', ?, '9999999999', 'Admin', 'User', TRUE, TRUE, 0, TRUE),
        ('unverified@etraffic.test', ?, '9876543210', 'Unverified', 'User', FALSE, FALSE, 0, FALSE)
      ON DUPLICATE KEY UPDATE email = email
    `, [hashedPassword, adminPassword, hashedPassword]);

    console.log('✓ Users seeded');

    // Get user IDs
    const [userRows] = await pool.query(`SELECT id, email FROM users WHERE email = 'user@etraffic.test'`) as any[];
    const userId = userRows[0]?.id;
    const [adminRows] = await pool.query(`SELECT id, email FROM users WHERE email = 'admin@etraffic.test'`) as any[];
    const adminId = adminRows[0]?.id;

    // Seed events (including Meskel)
    const meskelDate = new Date('2024-09-27'); // Meskel celebration date
    await pool.query(`
      INSERT INTO events (event_type, name_en, name_am, description_en, description_am, event_date, ethiopian_date, affected_area)
      VALUES
        ('holiday', 'Meskel', 'መስቀል', 'Meskel Celebration - Meskel Square area roads closed', 'የመስቀል በዓል - የመስቀል አደባባይ አካባቢ መንገዶች ዝግ', ?, 'Meskerem 17', 'Meskel Square, Churchill Avenue, Ras Abebe Aregay Street'),
        ('holiday', 'Ethiopian New Year', 'አዲስ አመት', 'Ethiopian New Year Celebration', 'የኢትዮጵያ አዲስ አመት በዓል', '2024-09-11', 'Meskerem 1', 'Various locations'),
        ('cultural_ceremony', 'Timket', 'ጥምቀት', 'Timket Epiphany Celebration', 'የጥምቀት በዓል', '2025-01-19', 'Tir 11', 'Various locations')
      ON DUPLICATE KEY UPDATE name_en = name_en
    `, [meskelDate]);

    console.log('✓ Events seeded');

    // Get Meskel event ID
    const [eventRows] = await pool.query(`SELECT id FROM events WHERE name_en = 'Meskel'`) as any[];
    const meskelEventId = eventRows[0]?.id;

    // Seed road closures for Meskel Square
    if (meskelEventId) {
      await pool.query(`
        INSERT INTO road_closures (event_id, road_name, start_latitude, start_longitude, end_latitude, end_longitude, closure_start, closure_end, alternate_route_description, severity)
        VALUES
          (?, 'Churchill Avenue near Meskel Square', 9.0125, 38.7561, 9.0150, 38.7570, ?, ?, 'Use Ras Mekonnen Avenue or Africa Avenue', 'full'),
          (?, 'Ras Abebe Aregay Street', 9.0130, 38.7550, 9.0140, 38.7565, ?, ?, 'Use Wollo Sefer route via Bole Road', 'full'),
          (?, 'Meskel Square Surrounding Area', 9.0120, 38.7555, 9.0160, 38.7575, ?, ?, 'Use alternative routes via Bole Road or Arat Kilo', 'partial')
        ON DUPLICATE KEY UPDATE road_name = road_name
      `, [
        meskelEventId, new Date('2024-09-27 06:00:00'), new Date('2024-09-27 18:00:00'),
        meskelEventId, new Date('2024-09-27 06:00:00'), new Date('2024-09-27 18:00:00'),
        meskelEventId, new Date('2024-09-27 06:00:00'), new Date('2024-09-27 18:00:00')
      ]);
    }

    console.log('✓ Road closures seeded (Meskel Square)');

    // Seed sample incidents
    if (userId) {
      await pool.query(`
        INSERT INTO incidents (user_id, incident_type, latitude, longitude, location_description, reported_latitude, reported_longitude, gps_distance_meters, description, severity, is_verified, credibility_score, coins_awarded, status)
        VALUES
          (?, 'heavy_congestion', 9.0125, 38.7561, 'Bole Road near Kazanchis', 9.0125, 38.7561, 0, 'Heavy traffic due to construction work. Multiple lanes blocked.', 'medium', TRUE, 0.8, 25, 'active'),
          (?, 'major_accident', 9.0300, 38.7600, 'Near Wollo Sefer', 9.0300, 38.7600, 0, 'Two vehicle accident blocking right lane. Emergency services on scene.', 'major', FALSE, 0.6, 10, 'active'),
          (?, 'road_construction', 9.0100, 38.7500, 'Africa Avenue', 9.0100, 38.7500, 0, 'Road construction reducing lanes. Expect delays.', 'minor', TRUE, 0.9, 25, 'active')
        ON DUPLICATE KEY UPDATE description = description
      `, [userId, userId, userId]);
    }

    console.log('✓ Incidents seeded');

    // Seed user locations for analytics
    if (userId) {
      await pool.query(`
        INSERT INTO user_locations (user_id, latitude, longitude, location_name, location_type, search_count)
        VALUES
          (?, 9.0125, 38.7561, 'Kazanchis', 'frequent', 15),
          (?, 9.0300, 38.7600, 'Wollo Sefer', 'frequent', 12),
          (?, 9.0200, 38.7550, 'Bole', 'search', 8)
        ON DUPLICATE KEY UPDATE search_count = search_count + 1
      `, [userId, userId, userId]);
    }

    console.log('✓ User locations seeded');

    console.log('\n✓ Database seeding completed successfully!');
    console.log('\nDemo accounts:');
    console.log('  - Verified User: user@etraffic.test / password123');
    console.log('  - Admin: admin@etraffic.test / admin123');
    console.log('  - Unverified: unverified@etraffic.test / password123');
    console.log('\nView Meskel Square road closures in Calendar section on September 27, 2024');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();

