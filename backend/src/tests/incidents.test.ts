/**
 * Incident Route Tests
 * Example unit tests for incident reporting flows
 */

import request from 'supertest';
import app from '../server';

describe('Incident Routes', () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    // Register and login to get token
    await request(app).post('/api/auth/register').send({
      email: 'incident@example.com',
      password: 'password123',
      ethiopianNationalId: '2222222222',
    });

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'incident@example.com',
      password: 'password123',
    });

    authToken = loginResponse.body.token;
    userId = loginResponse.body.user.id;
  });

  describe('GET /api/incidents', () => {
    it('should get active incidents', async () => {
      const response = await request(app).get('/api/incidents');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/incidents', () => {
    it('should reject unverified users', async () => {
      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          incidentType: 'heavy_congestion',
          latitude: 9.0249,
          longitude: 38.7469,
          reportedLatitude: 9.0249,
          reportedLongitude: 38.7469,
          description: 'Test incident',
        });

      // Should fail if user is not verified
      // In test, user starts unverified
      expect([400, 403]).toContain(response.status);
    });
  });
});

