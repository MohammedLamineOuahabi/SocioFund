const mysql = require('mysql2/promise');

// تكوين الاتصال بقاعدة البيانات MySQL
// يُقرأ من متغيرات البيئة للحفاظ على الأمان والمرونة
const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: 'Z',
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

let pool = null;

// تأكد من وجود المتغيرات المطلوبة
const validateConfig = () => {
  const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PORT', 'DB_PASSWORD', 'DB_NAME'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// تهيئة الاتصال (يتم إنشاء تجمع عند أول طلب)
const initialize = async () => {
  if (pool) {
    return pool;
  }

  try {
    validateConfig();
    pool = mysql.createPool(poolConfig);

    // اختبار الاتصال
    const connection = await pool.getConnection();
    connection.release();
    console.log('Successfully connected to MySQL database!');

    return pool;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// تنفيذ استعلام SQL مع معالجة الأخطاء
const query = async (sql, params = []) => {
  if (!pool) {
    await initialize();
  }
  try {
    if (typeof sql !== 'string' || sql.trim() === '') {
      throw new Error('Invalid SQL query');
    }
    if (params.includes(undefined)) {
      throw new Error('Bind parameters must not contain undefined values');
    }
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    // سجّل الخطأ في حالة حدوث مشكلة
    console.error('Query execution error:', {
      error: {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      },
      sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
      params: params
    });
    throw {
      type: 'DATABASE_ERROR',
      message: error.message,
      code: error.code,
      originalError: error
    };
  }
};

// تنفيذ معاملة (transaction) عند الحاجة
const transaction = async callback => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    console.error('Transaction error:', error);
    if (connection) {
      try {
        await connection.rollback();
        console.log('Transaction rolled back.');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// إغلاق التجمع (يُستدعى عند إنهاء التطبيق)
const end = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection pool closed');
  }
};

module.exports = {
  initialize,
  query,
  transaction,
  end
};