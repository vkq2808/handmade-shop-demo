const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const settingsController = require('../controllers/settings.controller');

// Public endpoints (combined for simplicity)
router.get('/public', settingsController.getPublic);

// Admin endpoints
router.get('/', protect, isAdmin, settingsController.getAdmin);
router.put('/', protect, isAdmin, settingsController.update);

module.exports = router;
