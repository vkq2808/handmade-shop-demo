const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const { getAllUsers, getUserById, updateUserRole, updateUserActive, deleteUser } = require('../controllers/user.controller');

// All routes require admin
router.use(protect, isAdmin);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id/role', updateUserRole);
router.put('/:id/active', updateUserActive);
router.delete('/:id', deleteUser);

module.exports = router;
