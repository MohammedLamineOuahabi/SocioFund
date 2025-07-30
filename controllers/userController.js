/*
 * وحدة المستخدم لتقديم معلومات المستخدم الحالي
 */

exports.me = async (req, res) => {
  // جلب بيانات المستخدم من middleware
  const { user } = req;
  if (!user) {
    return res.status(401).json({ message: 'غير مصرح' });
  }
  return res.json({ user });
};