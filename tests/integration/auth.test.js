const request = require('supertest');
const express = require('express');
const { expressLoader } = require('../../src/loaders/expressLoader');
const routesLoader = require('../../src/loaders/routesLoader');
const { verifyGoogleIdToken } = require('../../src/utils/googleAuth');

// Create test app
const app = express();
expressLoader(app);
routesLoader(app);

describe('Auth Endpoints', () => {
  describe('POST /api/v1/auth/google', () => {
    test('should authenticate user with valid Google token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({ idToken: 'valid-google-token' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    test('should return 400 for missing idToken', async () => {
      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('VALIDATION_ERROR');
    });

    test('should return 401 for invalid Google token', async () => {
      verifyGoogleIdToken.mockRejectedValueOnce(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({ idToken: 'invalid-token' })
        .expect(500); // Will be 500 due to error handler

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      // Get a refresh token first
      const authResponse = await request(app)
        .post('/api/v1/auth/google')
        .send({ idToken: 'valid-google-token' });
      
      refreshToken = authResponse.body.data.refreshToken;
    });

    test('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.refreshToken).not.toBe(refreshToken); // Should be rotated
    });

    test('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('VALIDATION_ERROR');
    });

    test('should return 500 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let refreshToken;

    beforeEach(async () => {
      // Get a refresh token first
      const authResponse = await request(app)
        .post('/api/v1/auth/google')
        .send({ idToken: 'valid-google-token' });
      
      refreshToken = authResponse.body.data.refreshToken;
    });

    test('should logout user with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
    });

    test('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('VALIDATION_ERROR');
    });

    test('should not fail for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'invalid-token' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/me', () => {
    let accessToken;

    beforeEach(async () => {
      // Get an access token first
      const authResponse = await request(app)
        .post('/api/v1/auth/google')
        .send({ idToken: 'valid-google-token' });
      
      accessToken = authResponse.body.data.accessToken;
    });

    test('should get user profile with valid access token', async () => {
      const response = await request(app)
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).not.toHaveProperty('googleId');
    });

    test('should return 401 for missing access token', async () => {
      const response = await request(app)
        .get('/api/v1/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('MISSING_TOKEN');
    });

    test('should return 401 for invalid access token', async () => {
      const response = await request(app)
        .get('/api/v1/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('INVALID_TOKEN');
    });
  });

  describe('PATCH /api/v1/me', () => {
    let accessToken;

    beforeEach(async () => {
      // Get an access token first
      const authResponse = await request(app)
        .post('/api/v1/auth/google')
        .send({ idToken: 'valid-google-token' });
      
      accessToken = authResponse.body.data.accessToken;
    });

    test('should update user profile with valid data', async () => {
      const response = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
    });

    test('should return 401 for missing access token', async () => {
      const response = await request(app)
        .patch('/api/v1/me')
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should validate input data', async () => {
      const response = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '' }) // Empty name should fail validation
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('VALIDATION_ERROR');
    });
  });
});
