const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const { createImport, listImports, updateImport, softDeleteImport } = require('../controllers/import.controller');

// Admin only
router.post('/', protect, isAdmin, createImport);
router.get('/', protect, isAdmin, listImports);
router.put('/:id', protect, isAdmin, updateImport);
router.delete('/:id', protect, isAdmin, softDeleteImport);

module.exports = router;
