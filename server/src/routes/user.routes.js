
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth');

// Rutas públicas
router.get('/profile/:id', userController.getUserProfile);

// Rutas protegidas
router.use(verifyToken);
router.get('/me', userController.getCurrentUser);
router.put('/me', userController.updateCurrentUser);
router.get('/all', userController.getAllUsers);
router.get('/search', userController.searchUsers);

module.exports = router;
