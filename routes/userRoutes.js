const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// جلب معلومات المستخدم الحالي
router.get('/me', authenticate, userController.me);

module.exports = router;