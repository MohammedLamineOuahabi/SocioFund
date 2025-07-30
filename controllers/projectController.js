const { query } = require('../config/database');

/*
 * وحدة إدارة المشاريع
 * تقوم بإنشاء مشاريع جديدة وجلب قائمة المشاريع أو مشروع واحد
 */

// إنشاء مشروع جديد
exports.createProject = async (req, res) => {
  try {
    const { title, description, targetAmount, impactDescription, ownerName } = req.body;
    if (!title || !description || !targetAmount || !ownerName) {
      return res.status(400).json({ message: 'يجب إدخال العنوان والوصف والهدف المالي واسم المالك' });
    }
    const sql = `INSERT INTO projects (title, description, targetAmount, currentAmount, impactDescription, ownerName) VALUES (?, ?, ?, 0, ?, ?)`;
    await query(sql, [title, description, targetAmount, impactDescription || null, ownerName]);
    return res.status(201).json({ message: 'تم إنشاء المشروع بنجاح' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'حدث خطأ أثناء إنشاء المشروع' });
  }
};

// جلب كافة المشاريع
exports.getProjects = async (req, res) => {
  try {
    const sql = `SELECT * FROM projects ORDER BY createdAt DESC`;
    const projects = await query(sql);
    return res.json(projects);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'حدث خطأ أثناء جلب المشاريع' });
  }
};

// جلب مشروع واحد بواسطة ID
exports.getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const sql = `SELECT * FROM projects WHERE projectId = ?`;
    const projects = await query(sql, [projectId]);
    if (projects.length === 0) {
      return res.status(404).json({ message: 'المشروع غير موجود' });
    }
    return res.json(projects[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'فشل في جلب بيانات المشروع' });
  }
};
