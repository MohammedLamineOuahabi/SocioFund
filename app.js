require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  console.log(req.body);
  next();
});
app.use(morgan('dev'));
// استيراد المسارات
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const fundingRoutes = require('./routes/fundingRoutes');

// middleware عامة
app.use(cors());
app.use(express.json());

// ربط المسارات
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/fundings', fundingRoutes);

// معالجة المسارات غير الموجودة
app.use((req, res) => {
  return res.status(404).json({ message: 'المسار غير موجود' });
});

// بدء الخادم
app.listen(port, () => {
  console.log(`SocioFund API تعمل على المنفذ ${port}`);
});
