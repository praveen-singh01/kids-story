const request = require('supertest');
const app = require('../src/server');
const { User, Kid, Content, Avatar, Category, Favorite, Progress } = require('../src/models');

describe('Comprehensive API Endpoints Testing', () => {
  let authToken;
  let testUser;
  let testKid;
  let testContent;
  let testAvatar;
  let testCategory;

  beforeAll(async () => {
    // Create test user and get auth token
    const userData = {
      email: 'apitest@example.com',
      password: 'password123',
      name: 'API Test User'
    };

    const authResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    testUser = authResponse.body.data.user;
    authToken = authResponse.body.data.accessToken;

    // Create test data
    testContent = new Content({
      type: 'story',
      title: 'API Test Story',
      description: 'A story for API testing',
      durationSec: 600,
      ageRange: '6-8',
      tags: ['test', 'api'],
      language: 'en',
      region: 'US',
      audioUrl: 'https://example.com/test-audio.mp3',
      imageUrl: 'https://example.com/test-image.jpg',
      isFeatured: true,
      popularityScore: 4.5
    });
    await testContent.save();

    testAvatar = new Avatar({
      name: 'API Test Avatar',
      src: 'https://example.com/test-avatar.png',
      type: 'raster',
      bgColorHex: '#FFFFFF',
      borderColorHex: '#000000',
      selectionColorHex: '#673AB7'
    });
    await testAvatar.save();

    testCategory = new Category({
      name: 'API Test Category',
      description: 'A category for API testing',
      imageUrl: 'https://example.com/test-category.jpg'
    });
    await testCategory.save();
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: 'apitest@example.com' });
    await Kid.deleteMany({ name: { $regex: /API Test/ } });
    await Content.deleteMany({ title: { $regex: /API Test/ } });
    await Avatar.deleteMany({ name: { $regex: /API Test/ } });
    await Category.deleteMany({ name: { $regex: /API Test/ } });
    await Favorite.deleteMany({});
    await Progress.deleteMany({});
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/v1/auth/register', () => {
      it('should register new user with valid data', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'newuser@example.com',
            password: 'password123',
            name: 'New User'
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data).toHaveProperty('refreshToken');
        expect(response.body.data).toHaveProperty('emailVerificationToken');

        // Clean up
        await User.deleteOne({ email: 'newuser@example.com' });
      });

      it('should reject invalid email format', async () => {
        await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'invalid-email',
            password: 'password123',
            name: 'Test User'
          })
          .expect(400);
      });

      it('should reject short password', async () => {
        await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'test@example.com',
            password: '123',
            name: 'Test User'
          })
          .expect(400);
      });

      it('should reject duplicate email', async () => {
        await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'apitest@example.com', // Already exists
            password: 'password123',
            name: 'Duplicate User'
          })
          .expect(409);
      });
    });

    describe('POST /api/v1/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'apitest@example.com',
            password: 'password123'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data).toHaveProperty('refreshToken');
      });

      it('should reject invalid credentials', async () => {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'apitest@example.com',
            password: 'wrongpassword'
          })
          .expect(401);
      });

      it('should reject non-existent user', async () => {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'password123'
          })
          .expect(401);
      });
    });
  });

  describe('User Management Endpoints', () => {
    describe('GET /api/v1/users/me', () => {
      it('should return current user profile', async () => {
        const response = await request(app)
          .get('/api/v1/users/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.email).toBe('apitest@example.com');
        expect(response.body.data.name).toBe('API Test User');
      });

      it('should reject unauthenticated requests', async () => {
        await request(app)
          .get('/api/v1/users/me')
          .expect(401);
      });

      it('should reject invalid token', async () => {
        await request(app)
          .get('/api/v1/users/me')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      });
    });

    describe('PATCH /api/v1/users/me', () => {
      it('should update user profile', async () => {
        const response = await request(app)
          .patch('/api/v1/users/me')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Updated API Test User' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Updated API Test User');
      });

      it('should validate input data', async () => {
        await request(app)
          .patch('/api/v1/users/me')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'A' }) // Too short
          .expect(400);
      });
    });
  });

  describe('Kid Profile Endpoints', () => {
    describe('POST /api/v1/kids', () => {
      it('should create kid profile with valid data', async () => {
        const response = await request(app)
          .post('/api/v1/kids')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'API Test Kid',
            ageRange: '6-8',
            avatarKey: 'wizard'
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('API Test Kid');
        expect(response.body.data.ageRange).toBe('6-8');
        
        testKid = response.body.data;
      });

      it('should validate required fields', async () => {
        await request(app)
          .post('/api/v1/kids')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Kid'
            // Missing ageRange
          })
          .expect(400);
      });

      it('should validate age range values', async () => {
        await request(app)
          .post('/api/v1/kids')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Kid',
            ageRange: 'invalid-range'
          })
          .expect(400);
      });
    });

    describe('GET /api/v1/kids', () => {
      it('should list user kid profiles', async () => {
        const response = await request(app)
          .get('/api/v1/kids')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('PATCH /api/v1/kids/:id', () => {
      it('should update kid profile', async () => {
        const response = await request(app)
          .patch(`/api/v1/kids/${testKid.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Updated API Test Kid' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Updated API Test Kid');
      });

      it('should reject invalid kid ID', async () => {
        await request(app)
          .patch('/api/v1/kids/invalid-id')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Updated Name' })
          .expect(400);
      });
    });
  });

  describe('Content Endpoints', () => {
    describe('GET /api/v1/content', () => {
      it('should list content with default parameters', async () => {
        const response = await request(app)
          .get('/api/v1/content')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('content');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.content)).toBe(true);
      });

      it('should filter content by age range', async () => {
        const response = await request(app)
          .get('/api/v1/content?ageRange=6-8')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.content.every(item => item.ageRange === '6-8')).toBe(true);
      });

      it('should filter content by type', async () => {
        const response = await request(app)
          .get('/api/v1/content?type=story')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.content.every(item => item.type === 'story')).toBe(true);
      });

      it('should paginate results', async () => {
        const response = await request(app)
          .get('/api/v1/content?limit=5&offset=0')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.pagination.limit).toBe(5);
        expect(response.body.data.pagination.offset).toBe(0);
      });

      it('should validate pagination parameters', async () => {
        await request(app)
          .get('/api/v1/content?limit=101') // Exceeds max limit
          .expect(400);
      });
    });

    describe('GET /api/v1/content/search', () => {
      it('should search content by query', async () => {
        const response = await request(app)
          .get('/api/v1/content/search?query=test')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should require search query', async () => {
        await request(app)
          .get('/api/v1/content/search')
          .expect(400);
      });

      it('should validate query length', async () => {
        await request(app)
          .get('/api/v1/content/search?query=a') // Too short
          .expect(400);
      });
    });

    describe('GET /api/v1/content/:slug', () => {
      it('should get content by slug', async () => {
        const response = await request(app)
          .get(`/api/v1/content/${testContent.slug}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe('API Test Story');
      });

      it('should return 404 for non-existent slug', async () => {
        await request(app)
          .get('/api/v1/content/non-existent-slug')
          .expect(404);
      });
    });
  });

  describe('Avatar Endpoints', () => {
    describe('GET /api/v1/avatars', () => {
      it('should list available avatars', async () => {
        const response = await request(app)
          .get('/api/v1/avatars')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('GET /api/v1/avatars/:id', () => {
      it('should get specific avatar', async () => {
        const response = await request(app)
          .get(`/api/v1/avatars/${testAvatar._id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('API Test Avatar');
      });

      it('should return 404 for non-existent avatar', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        await request(app)
          .get(`/api/v1/avatars/${fakeId}`)
          .expect(404);
      });
    });
  });
});
