const { query } = require('../config/database');

/*
 * وحدة إدارة التمويلات (المساهمات)
 * تُسجل مساهمة جديدة وتُرجع جميع المساهمات لمشروع معين
 */

// تمويل مشروع معين
exports.fundProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { amount } = req.body;
    const userId = req.user && req.user.userId;
    if (!userId) {
      return res.status(401).json({ message: 'يجب تسجيل الدخول للمساهمة' });
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'يرجى إدخال مبلغ تمويل صالح' });
    }
    // إضافة سجل التمويل
    const insertFunding = `INSERT INTO fundings (projectId, userId, amount) VALUES (?, ?, ?)`;
    await query(insertFunding, [projectId, userId, amount]);
    // تحديث المبلغ الحالي للمشروع
    const updateProject = `UPDATE projects SET currentAmount = currentAmount + ? WHERE projectId = ?`;
    await query(updateProject, [amount, projectId]);
    return res.status(201).json({ message: 'تم تمويل المشروع بنجاح' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'حدث خطأ أثناء تسجيل التمويل' });
  }
};

// جلب التمويلات الخاصة بمشروع معين
exports.getFundingByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const sql = `SELECT * FROM fundings WHERE projectId = ? ORDER BY createdAt DESC`;
    const fundings = await query(sql, [projectId]);
    return res.json(fundings);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'فشل في جلب بيانات التمويل' });
  }
};