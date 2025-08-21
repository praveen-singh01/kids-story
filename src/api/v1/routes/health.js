const express = require('express');
const { healthController } = require('../controllers');

const router = express.Router();

// Health check endpoint
router.get('/healthz', healthController.healthCheck);

// Readiness check endpoint
router.get('/readyz', healthController.readinessCheck);

// Metrics endpoint
router.get('/metrics', healthController.getMetrics);

module.exports = router;
