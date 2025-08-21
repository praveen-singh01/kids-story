const express = require('express');
const { kidController } = require('../controllers');
const { authGuard, userRateLimit, writeSlowDown } = require('../middlewares');
const { 
  validate, 
  createKidSchema, 
  updateKidSchema, 
  kidIdSchema, 
  updatePreferencesSchema 
} = require('../validators');

const router = express.Router();

// All routes require authentication
router.use(authGuard);
router.use(userRateLimit);

// Get all kids for current user
router.get('/', kidController.getKids);

// Create new kid profile
router.post('/',
  writeSlowDown,
  validate(createKidSchema),
  kidController.createKid
);

// Get kid by ID
router.get('/:id',
  validate(kidIdSchema),
  kidController.getKidById
);

// Update kid profile
router.patch('/:id',
  writeSlowDown,
  validate(updateKidSchema),
  kidController.updateKid
);

// Delete kid profile
router.delete('/:id',
  writeSlowDown,
  validate(kidIdSchema),
  kidController.deleteKid
);

// Get kid preferences
router.get('/:id/preferences',
  validate(kidIdSchema),
  kidController.getPreferences
);

// Update kid preferences
router.put('/:id/preferences',
  writeSlowDown,
  validate(updatePreferencesSchema),
  kidController.updatePreferences
);

module.exports = router;
