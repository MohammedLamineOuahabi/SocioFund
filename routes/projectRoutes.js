const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');

// إنشاء مشروع جديد (يتطلب تسجيل دخول)
router.post('/', authenticate, projectController.createProject);
// جلب كافة المشاريع
router.get('/', projectController.getProjects);
// جلب مشروع واحد
router.get('/:projectId', projectController.getProjectById);

module.exports = router;