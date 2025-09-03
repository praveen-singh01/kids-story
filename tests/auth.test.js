const request = require('supertest');
const app = require('../src/server');
const { User } = require('../src/models');
const googleAuth = require('../src/utils/googleAuth');

// Mock Google Auth utility
jest.mock('../src/utils/googleAuth');

describe('Authentication Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/google', () => {
    const mockGoogleUser = {
      googleId: 'google123',
      email: 'test@gmail.com',
      name: 'Test User',
      picture: 'https://example.com/picture.jpg',
      emailVerified: true
    };

    it('should authenticate new user with Google ID token', async () => {
      // Mock Google token verification
      googleAuth.verifyIdToken.mockResolvedValue(mockGoogleUser);

      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({
          idToken: 'valid-google-id-token'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(mockGoogleUser.email);
      expect(response.body.data.user.name).toBe(mockGoogleUser.name);
      expect(response.body.data.user.provider).toBe('google');

      // Verify user was created in database
      const user = await User.findOne({ email: mockGoogleUser.email });
      expect(user).toBeTruthy();
      expect(user.provider).toBe('google');
      expect(user.providerId).toBe(mockGoogleUser.googleId);
    });

    it('should authenticate existing Google user', async () => {
      // Create existing user
      const existingUser = new User({
        email: mockGoogleUser.email,
        name: 'Old Name',
        provider: 'google',
        providerId: mockGoogleUser.googleId,
        emailVerified: true,
        roles: ['user']
      });
      await existingUser.save();

      googleAuth.verifyIdToken.mockResolvedValue(mockGoogleUser);

      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({
          idToken: 'valid-google-id-token'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(mockGoogleUser.name); // Should update name

      // Verify user was updated
      const user = await User.findOne({ email: mockGoogleUser.email });
      expect(user.name).toBe(mockGoogleUser.name);
    });

    it('should convert email user to Google user', async () => {
      // Create existing email user
      const existingUser = new User({
        email: mockGoogleUser.email,
        name: 'Email User',
        provider: 'email',
        password: 'hashedpassword',
        emailVerified: true,
        roles: ['user']
      });
      await existingUser.save();

      googleAuth.verifyIdToken.mockResolvedValue(mockGoogleUser);

      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({
          idToken: 'valid-google-id-token'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user was converted to Google provider
      const user = await User.findOne({ email: mockGoogleUser.email });
      expect(user.provider).toBe('google');
      expect(user.providerId).toBe(mockGoogleUser.googleId);
    });

    it('should return error for invalid Google ID token', async () => {
      googleAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({
          idToken: 'invalid-google-id-token'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Google authentication failed');
    });

    it('should return validation error for missing ID token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Google ID token is required');
    });

    it('should handle rate limiting', async () => {
      googleAuth.verifyIdToken.mockResolvedValue(mockGoogleUser);

      // Make multiple requests to trigger rate limiting
      const requests = Array(6).fill().map(() =>
        request(app)
          .post('/api/v1/auth/google')
          .send({ idToken: 'valid-token' })
      );

      const responses = await Promise.all(requests);
      
      // First 5 should succeed, 6th should be rate limited
      expect(responses[5].status).toBe(429);
      expect(responses[5].body.error).toContain('Too many authentication attempts');
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register new user with email and password', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('emailVerificationToken');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.provider).toBe('email');

      // Verify user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.emailVerified).toBe(false);
    });

    it('should return error for duplicate email', async () => {
      // Create existing user
      const existingUser = new User({
        email: 'existing@example.com',
        name: 'Existing User',
        provider: 'email',
        password: 'hashedpassword',
        roles: ['user']
      });
      await existingUser.save();

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          name: 'New User'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User already exists with this email');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login user with valid credentials', async () => {
      // Create user
      const user = new User({
        email: 'login@example.com',
        name: 'Login User',
        provider: 'email',
        password: 'password123',
        emailVerified: true,
        roles: ['user']
      });
      await user.save();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });
  });
});
