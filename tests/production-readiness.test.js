const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const { User, Kid, Content, Avatar, Category, Favorite, Progress } = require('../src/models');

describe('Production Readiness Tests', () => {
  let authToken;
  let refreshToken;
  let testUser;
  let testKid;
  let testContent;

  beforeAll(async () => {
    // Wait for database connection
    await new Promise(resolve => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('open', resolve);
      }
    });
  });

  describe('1. Environment Configuration Validation', () => {
    it('should have all required environment variables', () => {
      const requiredEnvVars = [
        'NODE_ENV',
        'PORT',
        'MONGODB_URI',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'GOOGLE_CLIENT_ID'
      ];

      requiredEnvVars.forEach(envVar => {
        expect(process.env[envVar]).toBeDefined();
        expect(process.env[envVar]).not.toBe('');
      });
    });

    it('should have secure JWT secrets', () => {
      expect(process.env.JWT_SECRET.length).toBeGreaterThan(32);
      expect(process.env.JWT_REFRESH_SECRET.length).toBeGreaterThan(32);
      expect(process.env.JWT_SECRET).not.toBe('your-super-secret-jwt-key-here');
    });

    it('should have valid Google Client ID format', () => {
      expect(process.env.GOOGLE_CLIENT_ID).toMatch(/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/);
    });
  });

  describe('2. Database Connection and Models', () => {
    it('should connect to MongoDB successfully', () => {
      expect(mongoose.connection.readyState).toBe(1);
    });

    it('should have all required models defined', () => {
      expect(User).toBeDefined();
      expect(Kid).toBeDefined();
      expect(Content).toBeDefined();
      expect(Avatar).toBeDefined();
      expect(Category).toBeDefined();
      expect(Favorite).toBeDefined();
      expect(Progress).toBeDefined();
    });

    it('should create and validate user model', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        provider: 'email',
        password: 'password123',
        roles: ['user']
      };

      const user = new User(userData);
      await expect(user.save()).resolves.toBeTruthy();
      
      // Clean up
      await User.deleteOne({ _id: user._id });
    });
  });

  describe('3. Health Check Endpoints', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('version');
    });

    it('should return detailed health information', async () => {
      const response = await request(app)
        .get('/api/v1/health/detailed')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('database');
      expect(response.body.data).toHaveProperty('system');
      expect(response.body.data.database.status).toBe('connected');
    });
  });

  describe('4. Authentication System', () => {
    it('should register new user successfully', async () => {
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
      
      testUser = response.body.data.user;
      authToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should login existing user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'newuser@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should refresh tokens successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      
      // Update tokens for subsequent tests
      authToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should reject invalid credentials', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'newuser@example.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should reject requests without authentication', async () => {
      await request(app)
        .get('/api/v1/users/me')
        .expect(401);
    });
  });

  describe('5. User Management Endpoints', () => {
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newuser@example.com');
    });

    it('should update user profile', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should get user subscription details', async () => {
      const response = await request(app)
        .get('/api/v1/users/me/subscription')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('plan');
      expect(response.body.data).toHaveProperty('status');
    });
  });

  describe('6. Kid Profile Management', () => {
    it('should create kid profile', async () => {
      const kidData = {
        name: 'Test Kid',
        ageRange: '6-8',
        avatarKey: 'wizard'
      };

      const response = await request(app)
        .post('/api/v1/kids')
        .set('Authorization', `Bearer ${authToken}`)
        .send(kidData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Kid');
      expect(response.body.data.ageRange).toBe('6-8');
      
      testKid = response.body.data;
    });

    it('should list kid profiles', async () => {
      const response = await request(app)
        .get('/api/v1/kids')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should update kid profile', async () => {
      const response = await request(app)
        .patch(`/api/v1/kids/${testKid.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Kid Name' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Kid Name');
    });

    it('should validate kid profile input', async () => {
      await request(app)
        .post('/api/v1/kids')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'A', // Too short
          ageRange: 'invalid' // Invalid age range
        })
        .expect(400);
    });
  });

  describe('7. Content Management', () => {
    beforeAll(async () => {
      // Create test content
      testContent = new Content({
        type: 'story',
        title: 'Test Story',
        description: 'A test story for production testing',
        durationSec: 300,
        ageRange: '6-8',
        tags: ['test', 'story'],
        language: 'en',
        region: 'US',
        audioUrl: 'https://example.com/audio.mp3',
        imageUrl: 'https://example.com/image.jpg',
        isFeatured: true,
        popularityScore: 4.5
      });
      await testContent.save();
    });

    it('should list content with filtering', async () => {
      const response = await request(app)
        .get('/api/v1/content?ageRange=6-8&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('content');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.content)).toBe(true);
    });

    it('should search content', async () => {
      const response = await request(app)
        .get('/api/v1/content/search?query=test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get content by slug', async () => {
      const response = await request(app)
        .get(`/api/v1/content/${testContent.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Story');
    });

    it('should get featured content', async () => {
      const response = await request(app)
        .get('/api/v1/content/featured')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('8. Avatar Management', () => {
    beforeAll(async () => {
      // Create test avatar
      const avatar = new Avatar({
        name: 'Test Avatar',
        src: 'https://example.com/avatar.png',
        type: 'raster',
        bgColorHex: '#FFFFFF',
        borderColorHex: '#000000',
        selectionColorHex: '#673AB7'
      });
      await avatar.save();
    });

    it('should get available avatars', async () => {
      const response = await request(app)
        .get('/api/v1/avatars')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('9. Explore Features', () => {
    beforeAll(async () => {
      // Create test category
      const category = new Category({
        name: 'Test Category',
        description: 'A test category',
        imageUrl: 'https://example.com/category.jpg'
      });
      await category.save();
    });

    it('should get browse categories', async () => {
      const response = await request(app)
        .get('/api/v1/explore/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get continue playing items', async () => {
      const response = await request(app)
        .get('/api/v1/explore/continue')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get featured collections', async () => {
      const response = await request(app)
        .get('/api/v1/explore/collections')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('10. Favorites Management', () => {
    it('should get user favorites', async () => {
      const response = await request(app)
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('favorites');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should add content to favorites', async () => {
      const response = await request(app)
        .post('/api/v1/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contentId: testContent._id.toString(),
          contentType: 'story'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe('added');
    });

    it('should check favorite status', async () => {
      const response = await request(app)
        .get(`/api/v1/favorites/check/${testContent._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isFavorited).toBe(true);
    });
  });

  describe('11. Progress Tracking', () => {
    it('should update content progress', async () => {
      const response = await request(app)
        .post('/api/v1/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contentId: testContent._id.toString(),
          progress: 150,
          total: 300,
          completed: false
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.progress).toBe(150);
      expect(response.body.data.total).toBe(300);
    });

    it('should get progress for content', async () => {
      const response = await request(app)
        .get(`/api/v1/progress/${testContent._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.progress).toBe(150);
    });

    it('should get all user progress', async () => {
      const response = await request(app)
        .get('/api/v1/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('progress');
      expect(response.body.data).toHaveProperty('pagination');
    });
  });

  describe('12. Subscription Management', () => {
    it('should get current subscription', async () => {
      const response = await request(app)
        .get('/api/v1/subscriptions/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('plan');
      expect(response.body.data).toHaveProperty('status');
    });

    it('should get subscription plans', async () => {
      const response = await request(app)
        .get('/api/v1/subscriptions/plans')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('13. Security and Rate Limiting', () => {
    it('should have security headers', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });

    it('should validate input data', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Too short
          name: '' // Empty name
        })
        .expect(400);
    });

    it('should handle 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);
    });
  });

  describe('14. Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Try to create user with duplicate email
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com', // Already exists
          password: 'password123',
          name: 'Duplicate User'
        })
        .expect(409);
    });

    it('should handle invalid MongoDB ObjectIds', async () => {
      await request(app)
        .get('/api/v1/kids/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await User.deleteOne({ email: 'newuser@example.com' });
    }
    if (testContent) {
      await Content.deleteOne({ _id: testContent._id });
    }
    await Kid.deleteMany({ name: { $in: ['Test Kid', 'Updated Kid Name'] } });
    await Avatar.deleteMany({ name: 'Test Avatar' });
    await Category.deleteMany({ name: 'Test Category' });
    await Favorite.deleteMany({});
    await Progress.deleteMany({});
  });
});
