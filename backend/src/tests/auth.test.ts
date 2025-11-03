/**
 * Auth Route Tests
 * Example unit tests for authentication flows
 */

import request from 'supertest';
import app from '../server';
import pool from '../db/connection';

describe('Auth Routes', () => {
  beforeAll(async () => {
    // Setup test database if needed
  });

  afterAll(async () => {
    // Cleanup
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with Ethiopian National ID', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          ethiopianNationalId: '1234567890123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('userId');
    });

    it('should reject duplicate email or National ID', async () => {
      // First registration
      await request(app).post('/api/auth/register').send({
        email: 'duplicate@example.com',
        password: 'password123',
        ethiopianNationalId: '9999999999',
      });

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          ethiopianNationalId: '8888888888',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Register first
      await request(app).post('/api/auth/register').send({
        email: 'login@example.com',
        password: 'password123',
        ethiopianNationalId: '1111111111',
      });

      // Login
      const response = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'invalid@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
    });
  });
});

