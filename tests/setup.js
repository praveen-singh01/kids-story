const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const Redis = require('ioredis-mock');

// Global test setup
let mongoServer;
let redisClient;

beforeAll(async () => {
  // Setup in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
  
  // Setup mock Redis
  redisClient = new Redis();
  
  // Mock Redis loader
  jest.mock('../src/loaders/redisLoader', () => ({
    redisLoader: jest.fn().mockResolvedValue(redisClient),
    checkRedisHealth: jest.fn().mockResolvedValue({ status: 'healthy' }),
    getRedisClient: jest.fn().mockReturnValue(redisClient),
    cache: {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(true),
      exists: jest.fn().mockResolvedValue(false),
      blacklist: jest.fn().mockResolvedValue(true),
      isBlacklisted: jest.fn().mockResolvedValue(false),
    },
    closeRedis: jest.fn().mockResolvedValue(),
    isConnected: true,
  }));
  
  // Mock Google Auth
  jest.mock('../src/utils/googleAuth', () => ({
    verifyGoogleIdToken: jest.fn().mockResolvedValue({
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true,
      googleId: 'google123',
    }),
  }));
  
  // Mock payments client
  jest.mock('../src/utils/clients/paymentsClient', () => ({
    post: jest.fn().mockResolvedValue({
      data: { checkoutUrl: 'https://checkout.example.com' },
    }),
  }));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  if (redisClient) {
    redisClient.disconnect();
  }
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  
  // Clear Redis mock
  if (redisClient) {
    await redisClient.flushall();
  }
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  createTestUser: async () => {
    const { User } = require('../src/models');
    return User.create({
      email: 'test@example.com',
      name: 'Test User',
      provider: 'google',
      googleId: 'google123',
      roles: ['user'],
    });
  },
  
  createTestKid: async (userId) => {
    const { KidProfile } = require('../src/models');
    return KidProfile.create({
      userId,
      name: 'Test Kid',
      ageRange: '6-8',
      avatarKey: 'test-avatar',
      preferences: {
        sleepGoals: ['Sleep better'],
        tags: ['calming'],
      },
    });
  },
  
  createTestContent: async () => {
    const { Content } = require('../src/models');
    return Content.create({
      type: 'story',
      title: 'Test Story',
      slug: 'test-story',
      durationSec: 300,
      ageRange: '6-8',
      tags: ['calming'],
      language: 'en',
      region: 'US',
      audioUrl: '/audio/test-story.mp3',
      imageUrl: '/images/test-story.jpg',
      isFeatured: false,
      popularityScore: 50,
    });
  },
  
  generateTestJWT: (userId) => {
    const { generateAccessToken } = require('../src/utils/jwt');
    return generateAccessToken(userId);
  },
};
