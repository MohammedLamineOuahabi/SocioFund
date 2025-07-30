const express = require('express');
const router = express.Router();
const fundingController = require('../controllers/fundingController');
const { authenticate } = require('../middleware/auth');

// تمويل مشروع معين
router.post('/:projectId', authenticate, fundingController.fundProject);
// جلب كل التمويلات لمشروع معين
router.get('/:projectId', fundingController.getFundingByProject);

module.exports = router;