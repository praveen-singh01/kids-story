const express = require('express');
const { subscriptionController } = require('../controllers');
const { paymentsM2MGuard } = require('../middlewares');
const { 
  validate, 
  paymentEventSchema 
} = require('../validators');

const router = express.Router();

// M2M routes for payments service
router.use('/payments', paymentsM2MGuard);

// Process payment events from payments service
router.post('/payments/events',
  validate(paymentEventSchema),
  subscriptionController.processPaymentEvent
);

module.exports = router;
