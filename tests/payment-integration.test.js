const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/server');
const { User } = require('../src/models');
const paymentService = require('../src/services/paymentService');
const JWTUtils = require('../src/utils/jwt');

// Mock the payment service
jest.mock('../src/services/paymentService');

describe('Payment Microservice Integration', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Create a test user
    testUser = new User({
      email: 'test@example.com',
      name: 'Test User',
      provider: 'google',
      providerId: 'test123',
      isActive: true
    });
    await testUser.save();

    // Generate auth token using the JWT utils
    const tokens = JWTUtils.generateTokens({ userId: testUser._id.toString() });
    authToken = tokens.accessToken;
  });

  afterAll(async () => {
    // Clean up test user
    await User.findByIdAndDelete(testUser._id);
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/v1/payment/order', () => {
    it('should create a new order successfully', async () => {
      const mockOrder = {
        orderId: 'order_123',
        amount: 9900,
        currency: 'INR',
        razorpayOrderId: 'order_razorpay_123',
        status: 'created'
      };

      paymentService.createOrder.mockResolvedValue(mockOrder);

      const response = await request(app)
        .post('/api/v1/payment/order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 9900,
          currency: 'INR',
          paymentContext: { planType: 'monthly' }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orderId).toBe('order_123');
      expect(paymentService.createOrder).toHaveBeenCalledWith(
        testUser._id.toString(),
        9900,
        'INR',
        { planType: 'monthly' }
      );
    });

    it('should return 400 for invalid amount', async () => {
      const response = await request(app)
        .post('/api/v1/payment/order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: -100,
          currency: 'INR'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/payment/order')
        .send({
          amount: 9900,
          currency: 'INR'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/payment/subscription', () => {
    it('should create a new subscription successfully', async () => {
      const mockSubscription = {
        subscriptionId: 'sub_123',
        planId: 'plan_kids_story_monthly',
        status: 'created',
        razorpaySubscriptionId: 'sub_razorpay_123',
        shortUrl: 'https://rzp.io/i/abc123'
      };

      paymentService.createSubscription.mockResolvedValue(mockSubscription);

      const response = await request(app)
        .post('/api/v1/payment/subscription')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planId: 'plan_kids_story_monthly',
          paymentContext: { userType: 'premium' }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subscriptionId).toBe('sub_123');
      expect(paymentService.createSubscription).toHaveBeenCalledWith(
        testUser._id.toString(),
        'plan_kids_story_monthly',
        { userType: 'premium' }
      );
    });

    it('should return 400 for invalid plan ID', async () => {
      const response = await request(app)
        .post('/api/v1/payment/subscription')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planId: 'invalid_plan'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/payment/orders', () => {
    it('should retrieve user orders successfully', async () => {
      const mockOrders = {
        orders: [
          {
            orderId: 'order_123',
            amount: 9900,
            status: 'paid',
            createdAt: new Date().toISOString()
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1
        }
      };

      paymentService.getUserOrders.mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/api/v1/payment/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(paymentService.getUserOrders).toHaveBeenCalledWith(
        testUser._id.toString(),
        1,
        10
      );
    });
  });

  describe('GET /api/v1/payment/subscriptions', () => {
    it('should retrieve user subscriptions successfully', async () => {
      const mockSubscriptions = {
        subscriptions: [
          {
            subscriptionId: 'sub_123',
            planId: 'plan_kids_story_monthly',
            status: 'active'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1
        }
      };

      paymentService.getUserSubscriptions.mockResolvedValue(mockSubscriptions);

      const response = await request(app)
        .get('/api/v1/payment/subscriptions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subscriptions).toHaveLength(1);
    });
  });

  describe('POST /api/v1/payment/verify-success', () => {
    it('should verify payment successfully', async () => {
      const mockVerification = {
        success: true,
        orderId: 'order_123',
        paymentId: 'pay_123',
        status: 'verified'
      };

      paymentService.verifyPayment.mockResolvedValue(mockVerification);

      const response = await request(app)
        .post('/api/v1/payment/verify-success')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          razorpay_order_id: 'order_razorpay_123',
          razorpay_payment_id: 'pay_razorpay_123',
          razorpay_signature: 'signature_123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toBe(true);
    });
  });

  describe('POST /api/v1/payment/callback', () => {
    it('should handle payment callback successfully', async () => {
      paymentService.updateUserSubscription.mockResolvedValue({});
      paymentService.updateOrderStatus.mockResolvedValue({});

      const response = await request(app)
        .post('/api/v1/payment/callback')
        .send({
          userId: testUser._id.toString(),
          subscriptionId: 'sub_123',
          razorpaySubscriptionId: 'sub_razorpay_123',
          status: 'active',
          paymentContext: { planType: 'monthly' }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(paymentService.updateUserSubscription).toHaveBeenCalled();
    });

    it('should handle order callback successfully', async () => {
      paymentService.updateOrderStatus.mockResolvedValue({});

      const response = await request(app)
        .post('/api/v1/payment/callback')
        .send({
          userId: testUser._id.toString(),
          orderId: 'order_123',
          razorpayOrderId: 'order_razorpay_123',
          status: 'paid',
          paymentContext: { amount: 9900 }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(paymentService.updateOrderStatus).toHaveBeenCalledWith('order_123', 'paid');
    });

    it('should handle failed payment callback', async () => {
      const response = await request(app)
        .post('/api/v1/payment/callback')
        .send({
          userId: testUser._id.toString(),
          orderId: 'order_123',
          status: 'failed',
          paymentContext: { reason: 'insufficient_funds' }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Should not call update functions for failed payments
      expect(paymentService.updateUserSubscription).not.toHaveBeenCalled();
      expect(paymentService.updateOrderStatus).not.toHaveBeenCalled();
    });
  });
});

describe('Payment Service Client', () => {
  // Temporarily unmock the service for these tests
  beforeAll(() => {
    jest.unmock('../src/services/paymentService');
  });

  afterAll(() => {
    jest.mock('../src/services/paymentService');
  });

  describe('JWT Token Generation', () => {
    it('should generate valid JWT tokens', () => {
      // Import the actual service for this test
      const actualPaymentService = require('../src/services/paymentService');
      const userId = 'test_user_123';
      const token = actualPaymentService.generateToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token structure
      const decoded = jwt.verify(token, process.env.PAYMENT_JWT_SECRET);
      expect(decoded.userId).toBe(userId);
      expect(decoded.appId).toBe(process.env.PAYMENT_PACKAGE_ID);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should generate headers with correct format', () => {
      const actualPaymentService = require('../src/services/paymentService');
      const userId = 'test_user_123';
      const headers = actualPaymentService.getHeaders(userId);

      expect(headers).toHaveProperty('Authorization');
      expect(headers).toHaveProperty('x-app-id');
      expect(headers).toHaveProperty('Content-Type');

      expect(headers['x-app-id']).toBe(process.env.PAYMENT_PACKAGE_ID);
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Authorization']).toMatch(/^Bearer /);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate required environment variables', () => {
      // Since the service is already initialized, just check that it has the required properties
      const actualPaymentService = require('../src/services/paymentService');
      expect(actualPaymentService.baseUrl).toBeDefined();
      expect(actualPaymentService.packageId).toBeDefined();
      expect(actualPaymentService.jwtSecret).toBeDefined();
    });
  });
});
