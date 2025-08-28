const express = require('express');
const router = express.Router();
const {
  createOrder,
  createSubscription,
  getUserOrders,
  getUserSubscriptions,
  getSubscriptionPlans,
  verifyPayment,
  handlePaymentCallback,
  getPaymentServiceStatus
} = require('../controllers/paymentController');
const { authGuard } = require('../middlewares');
const { validate } = require('../validators');
const { body, query } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Order ID
 *         paymentOrderId:
 *           type: string
 *           description: Payment microservice order ID
 *         razorpayOrderId:
 *           type: string
 *           description: Razorpay order ID
 *         amount:
 *           type: number
 *           description: Order amount in paise
 *         currency:
 *           type: string
 *           description: Currency code
 *         status:
 *           type: string
 *           enum: [created, attempted, paid, failed, cancelled, refunded]
 *           description: Order status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Order creation timestamp
 *     
 *     Subscription:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Subscription ID
 *         paymentSubscriptionId:
 *           type: string
 *           description: Payment microservice subscription ID
 *         razorpaySubscriptionId:
 *           type: string
 *           description: Razorpay subscription ID
 *         planType:
 *           type: string
 *           enum: [trial, monthly, yearly]
 *           description: Subscription plan type
 *         planName:
 *           type: string
 *           description: Plan name
 *         amount:
 *           type: number
 *           description: Subscription amount in paise
 *         status:
 *           type: string
 *           enum: [created, authenticated, active, paused, halted, cancelled, completed, expired]
 *           description: Subscription status
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Subscription start date
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Subscription end date
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Subscription creation timestamp
 */

/**
 * @swagger
 * /api/v1/payment/status:
 *   get:
 *     summary: Get payment service status
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment service status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                     microserviceUrl:
 *                       type: string
 *                     packageId:
 *                       type: string
 */
router.get('/status', authGuard, getPaymentServiceStatus);

/**
 * @swagger
 * /api/v1/payment/plans:
 *   get:
 *     summary: Get available subscription plans
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     plans:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           planId:
 *                             type: string
 *                           name:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           duration:
 *                             type: string
 *                           description:
 *                             type: string
 *                           type:
 *                             type: string
 */
router.get('/plans', authGuard, getSubscriptionPlans);

/**
 * @swagger
 * /api/v1/payment/order:
 *   post:
 *     summary: Create a payment order
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount in paise
 *                 minimum: 1
 *               currency:
 *                 type: string
 *                 description: Currency code
 *                 default: INR
 *               orderType:
 *                 type: string
 *                 enum: [content_purchase, subscription, premium_access, other]
 *                 default: other
 *               relatedId:
 *                 type: string
 *                 description: Related content or subscription ID
 *               description:
 *                 type: string
 *                 description: Order description
 *     responses:
 *       200:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       $ref: '#/components/schemas/Order'
 *                     razorpayKey:
 *                       type: string
 *                     razorpayOrderId:
 *                       type: string
 */
router.post('/order',
  authGuard,
  [
    body('amount')
      .isNumeric()
      .withMessage('Amount must be a number')
      .isInt({ min: 1 })
      .withMessage('Amount must be greater than 0'),
    body('currency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency must be 3 characters'),
    body('orderType')
      .optional()
      .isIn(['content_purchase', 'subscription', 'premium_access', 'other'])
      .withMessage('Invalid order type'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters')
  ],
  validate,
  createOrder
);

/**
 * @swagger
 * /api/v1/payment/subscription:
 *   post:
 *     summary: Create a subscription
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planType
 *             properties:
 *               planType:
 *                 type: string
 *                 enum: [trial, monthly, yearly]
 *                 description: Subscription plan type
 *               description:
 *                 type: string
 *                 description: Subscription description
 *     responses:
 *       200:
 *         description: Subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscription:
 *                       $ref: '#/components/schemas/Subscription'
 *                     razorpayKey:
 *                       type: string
 *                     razorpaySubscriptionId:
 *                       type: string
 */
router.post('/subscription',
  authGuard,
  [
    body('planType')
      .isIn(['trial', 'monthly', 'yearly'])
      .withMessage('Plan type must be trial, monthly, or yearly'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters')
  ],
  validate,
  createSubscription
);

/**
 * @swagger
 * /api/v1/payment/orders:
 *   get:
 *     summary: Get user orders
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [created, attempted, paid, failed, cancelled, refunded]
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/orders',
  authGuard,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['created', 'attempted', 'paid', 'failed', 'cancelled', 'refunded'])
      .withMessage('Invalid status')
  ],
  validate,
  getUserOrders
);

/**
 * @swagger
 * /api/v1/payment/subscriptions:
 *   get:
 *     summary: Get user subscriptions
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [created, authenticated, active, paused, halted, cancelled, completed, expired]
 *         description: Filter by subscription status
 *       - in: query
 *         name: planType
 *         schema:
 *           type: string
 *           enum: [trial, monthly, yearly]
 *         description: Filter by plan type
 *     responses:
 *       200:
 *         description: Subscriptions retrieved successfully
 */
router.get('/subscriptions',
  authGuard,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['created', 'authenticated', 'active', 'paused', 'halted', 'cancelled', 'completed', 'expired'])
      .withMessage('Invalid status'),
    query('planType')
      .optional()
      .isIn(['trial', 'monthly', 'yearly'])
      .withMessage('Invalid plan type')
  ],
  validate,
  getUserSubscriptions
);

/**
 * @swagger
 * /api/v1/payment/verify:
 *   post:
 *     summary: Verify payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpay_order_id
 *               - razorpay_payment_id
 *               - razorpay_signature
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified successfully
 */
router.post('/verify',
  authGuard,
  [
    body('razorpay_order_id')
      .notEmpty()
      .withMessage('Razorpay order ID is required'),
    body('razorpay_payment_id')
      .notEmpty()
      .withMessage('Razorpay payment ID is required'),
    body('razorpay_signature')
      .notEmpty()
      .withMessage('Razorpay signature is required')
  ],
  validate,
  verifyPayment
);

/**
 * @swagger
 * /api/v1/payment/callback:
 *   post:
 *     summary: Handle payment callback from payment microservice
 *     tags: [Payment]
 *     description: This endpoint is called by the payment microservice to notify about payment status changes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               orderId:
 *                 type: string
 *               subscriptionId:
 *                 type: string
 *               razorpayOrderId:
 *                 type: string
 *               razorpaySubscriptionId:
 *                 type: string
 *               razorpayPaymentId:
 *                 type: string
 *               status:
 *                 type: string
 *               paymentContext:
 *                 type: object
 *     responses:
 *       200:
 *         description: Callback processed successfully
 */
router.post('/callback', handlePaymentCallback);

module.exports = router;
