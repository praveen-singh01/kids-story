const request = require('supertest');
const app = require('../src/server');
const { User } = require('../src/models');
const googleAuth = require('../src/utils/googleAuth');

// Mock Google Auth for testing
jest.mock('../src/utils/googleAuth');

describe('Google Authentication Integration Tests', () => {
  const mockGoogleUser = {
    googleId: 'google_test_123',
    email: 'testuser@gmail.com',
    name: 'Test Google User',
    picture: 'https://lh3.googleusercontent.com/test',
    emailVerified: true
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Clean up any existing test users
    await User.deleteMany({ email: mockGoogleUser.email });
  });

  afterEach(async () => {
    // Clean up test users after each test
    await User.deleteMany({ email: mockGoogleUser.email });
  });

  describe('Google OAuth Flow - New User Registration', () => {
    it('should create new user with Google OAuth', async () => {
      googleAuth.verifyIdToken.mockResolvedValue(mockGoogleUser);

      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({
          idToken: 'mock_google_id_token'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');

      const { user } = response.body.data;
      expect(user.email).toBe(mockGoogleUser.email);
      expect(user.name).toBe(mockGoogleUser.name);
      expect(user.provider).toBe('google');
      expect(user.emailVerified).toBe(true);

      // Verify user was created in database
      const dbUser = await User.findOne({ email: mockGoogleUser.email });
      expect(dbUser).toBeTruthy();
      expect(dbUser.provider).toBe('google');
      expect(dbUser.providerId).toBe(mockGoogleUser.googleId);
    });

    it('should generate valid JWT tokens', async () => {
      googleAuth.verifyIdToken.mockResolvedValue(mockGoogleUser);

      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({
          idToken: 'mock_google_id_token'
        })
        .expect(200);

      const { accessToken, refreshToken } = response.body.data;
      
      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');

      // Test that access token works for protected endpoints
      const protectedResponse = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(protectedResponse.body.success).toBe(true);
      expect(protectedResponse.body.data.email).toBe(mockGoogleUser.email);
    });
  });

  describe('Google OAuth Flow - Existing User Login', () => {
    it('should login existing Google user', async () => {
      // Create existing Google user
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
          idToken: 'mock_google_id_token'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(mockGoogleUser.name); // Should update name

      // Verify user was updated in database
      const updatedUser = await User.findOne({ email: mockGoogleUser.email });
      expect(updatedUser.name).toBe(mockGoogleUser.name);
      expect(updatedUser.lastLoginAt).toBeTruthy();
    });

    it('should convert email user to Google user', async () => {
      // Create existing email user
      const existingUser = new User({
        email: mockGoogleUser.email,
        name: 'Email User',
        provider: 'email',
        password: 'hashedpassword',
        emailVerified: false,
        roles: ['user']
      });
      await existingUser.save();

      googleAuth.verifyIdToken.mockResolvedValue(mockGoogleUser);

      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({
          idToken: 'mock_google_id_token'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user was converted to Google provider
      const convertedUser = await User.findOne({ email: mockGoogleUser.email });
      expect(convertedUser.provider).toBe('google');
      expect(convertedUser.providerId).toBe(mockGoogleUser.googleId);
      expect(convertedUser.emailVerified).toBe(true);
    });
  });

  describe('Google OAuth Error Handling', () => {
    it('should handle invalid Google ID token', async () => {
      googleAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({
          idToken: 'invalid_google_id_token'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Google authentication failed');
    });

    it('should handle missing ID token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Google ID token is required');
    });

    it('should handle Google service errors', async () => {
      googleAuth.verifyIdToken.mockRejectedValue(new Error('Google service unavailable'));

      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({
          idToken: 'valid_token'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Google authentication failed');
    });
  });

  describe('Google OAuth Rate Limiting', () => {
    it('should enforce rate limiting on auth endpoints', async () => {
      googleAuth.verifyIdToken.mockResolvedValue(mockGoogleUser);

      // Make multiple requests to trigger rate limiting
      const requests = [];
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post('/api/v1/auth/google')
            .send({ idToken: 'test_token' })
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Google OAuth Security', () => {
    it('should not expose sensitive user data', async () => {
      googleAuth.verifyIdToken.mockResolvedValue(mockGoogleUser);

      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({
          idToken: 'mock_google_id_token'
        })
        .expect(200);

      const { user } = response.body.data;
      
      // Should not expose password, verification tokens, etc.
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('emailVerificationToken');
      expect(user).not.toHaveProperty('passwordResetToken');
      expect(user).not.toHaveProperty('__v');
      expect(user).not.toHaveProperty('_id');
    });

    it('should validate Google Client ID configuration', () => {
      expect(process.env.GOOGLE_CLIENT_ID).toBeDefined();
      expect(process.env.GOOGLE_CLIENT_ID).not.toBe('your-google-client-id');
      expect(process.env.GOOGLE_CLIENT_ID).toMatch(/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/);
    });
  });

  describe('Token Management', () => {
    let accessToken, refreshToken;

    beforeEach(async () => {
      googleAuth.verifyIdToken.mockResolvedValue(mockGoogleUser);

      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({
          idToken: 'mock_google_id_token'
        });

      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should refresh tokens successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      
      // New tokens should be different from old ones
      expect(response.body.data.accessToken).not.toBe(accessToken);
      expect(response.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('should reject invalid refresh tokens', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid_refresh_token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid refresh token');
    });
  });

  describe('User Journey After Google Auth', () => {
    let accessToken;

    beforeEach(async () => {
      googleAuth.verifyIdToken.mockResolvedValue(mockGoogleUser);

      const response = await request(app)
        .post('/api/v1/auth/google')
        .send({
          idToken: 'mock_google_id_token'
        });

      accessToken = response.body.data.accessToken;
    });

    it('should allow authenticated user to create kid profiles', async () => {
      const response = await request(app)
        .post('/api/v1/kids')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Google Auth Kid',
          ageRange: '6-8',
          avatarKey: 'wizard'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Google Auth Kid');
    });

    it('should allow authenticated user to access content', async () => {
      const response = await request(app)
        .get('/api/v1/content')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('content');
    });

    it('should allow authenticated user to manage favorites', async () => {
      // First, create some test content
      const { Content } = require('../src/models');
      const testContent = new Content({
        type: 'story',
        title: 'Google Auth Test Story',
        description: 'Test story for Google auth',
        durationSec: 300,
        ageRange: '6-8',
        tags: ['test'],
        audioUrl: 'https://example.com/audio.mp3',
        imageUrl: 'https://example.com/image.jpg'
      });
      await testContent.save();

      const response = await request(app)
        .post('/api/v1/favorites')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          contentId: testContent._id.toString(),
          contentType: 'story'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe('added');

      // Clean up
      await Content.deleteOne({ _id: testContent._id });
    });
  });
});
