const jwt = require('jsonwebtoken');

/*
 * Middleware للتحقق من صحة رمز JWT وإرفاق معلومات المستخدم في الطلب
 */

exports.authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'الرجاء تسجيل الدخول أولاً' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = { userId: payload.userId };
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'رمز JWT غير صالح' });
  }
};