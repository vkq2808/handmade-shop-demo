const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { listFavorites, toggleFavorite, addFavorite, removeFavorite, checkFavorite } = require('../controllers/favorite.controller');

// All favorites APIs require auth
router.use(protect);

// List favorites
router.get('/', listFavorites);

// Check favorite state
router.get('/check/:productId', checkFavorite);

// Toggle favorite by product id
router.post('/:productId', toggleFavorite);

// Add via body
router.post('/add', addFavorite);

// Remove by product id
router.delete('/:productId', removeFavorite);

module.exports = router;
