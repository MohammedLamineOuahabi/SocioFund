const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/*
 * وحدة مصادقة مبسطة
 * تقدم عمليات التسجيل وتسجيل الدخول للمستخدمين.
 * تستخدم كلمات مرور مشفرة وJSON Web Tokens لمصادقة الجلسات.
 */

// تسجيل مستخدم جديد
exports.register = async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'يجب إدخال الاسم ورقم الهاتف وكلمة المرور' });
    }
    // التأكد من عدم وجود المستخدم بالفعل
    const existing = await query('SELECT userId FROM users WHERE phone = ?', [phone]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'رقم الهاتف مستخدم بالفعل' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await query('INSERT INTO users (name, phone, password) VALUES (?, ?, ?)', [name, phone, hashedPassword]);
    return res.status(201).json({ message: 'تم التسجيل بنجاح' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'حدث خطأ أثناء عملية التسجيل' });
  }
};

// تسجيل الدخول
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: 'يجب إدخال رقم الهاتف وكلمة المرور' });
    }
    const users = await query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'بيانات الاعتماد غير صحيحة' });
    }
    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'بيانات الاعتماد غير صحيحة' });
    }
    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    // حذف كلمة المرور من الاستجابة
    delete user.password;
    return res.json({ token, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الدخول' });
  }
};