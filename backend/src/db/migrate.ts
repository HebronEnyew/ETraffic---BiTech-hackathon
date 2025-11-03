import fs from 'fs';
import path from 'path';
import pool from './connection';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  try {
    console.log('Starting database migrations...');

    // Create database if it doesn't exist
    const dbName = process.env.DATABASE_NAME || 'etraffic';
    const connection = await pool.getConnection();
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    await connection.query(`USE ${dbName}`);
    connection.release();

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files`);

    // Execute each migration
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      console.log(`Executing ${file}...`);
      
      // Split SQL into individual statements and execute them separately
      // Remove line comments first, then split by semicolon
      const cleanedSql = sql
        .split('\n')
        .map(line => line.includes('--') ? line.split('--')[0] : line)
        .join('\n');
      
      const statements = cleanedSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        await pool.query(statement + ';');
      }
      
      console.log(`✓ ${file} completed`);
    }

    console.log('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

