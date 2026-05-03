const express = require('express');
const cors = require('cors');

const app = express();

// 1. CORS
const ALLOWED_ORIGINS = [
  'https://pikachuprogrammer01.github.io',
  'https://myblog-api-five.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));

// 2. Raw body for multipart upload (must be before JSON parser)
app.use('/api/admin/articles/upload', express.raw({
  type: 'multipart/form-data',
  limit: '50mb',
}));

// 2. JSON body parser (compatible with Vercel's pre-parsed req.body)
app.use((req, res, next) => {
  // Vercel @vercel/node helper pre-parses JSON body — if already done, skip Express parser
  if (req.body && typeof req.body === 'object' && !(req.body instanceof Buffer)) {
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});

// 4. Mount public routes
const authRouter = require('./routes/auth');
const articlesRouter = require('./routes/articles');
const categoriesRouter = require('./routes/categories');
const statsRouter = require('./routes/stats');
const commentsRouter = require('./routes/comments');
const likesRouter = require('./routes/likes');
const contactRouter = require('./routes/contact');
const tagsRouter = require('./routes/tags');
const toolsRouter = require('./routes/tools');
const interviewRouter = require('./routes/interview');

app.use('/api/auth', authRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/stats', statsRouter);
app.use('/api', commentsRouter);
app.use('/api', likesRouter);
app.use('/api/contact', contactRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/tools', toolsRouter);
app.use('/api/interview', interviewRouter);

// 5. Mount admin routes
const adminArticlesRouter = require('./routes/admin/articles');
const adminUsersRouter = require('./routes/admin/users');
const adminCommentsRouter = require('./routes/admin/comments');
const adminTagsRouter = require('./routes/admin/tags');
const adminToolsRouter = require('./routes/admin/tools');
const adminSystemRouter = require('./routes/admin/system');
const adminInterviewRouter = require('./routes/admin/interview');

app.use('/api/admin/articles', adminArticlesRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin/comments', adminCommentsRouter);
app.use('/api/admin/tags', adminTagsRouter);
app.use('/api/admin/tools', adminToolsRouter);
app.use('/api/admin', adminSystemRouter);
app.use('/api/admin/interview', adminInterviewRouter);

// 6. Health check
app.get('/api/health', async (req, res) => {
  try {
    const pool = require('./db');
    await pool.execute('SELECT 1');
    return res.status(200).json({ success: true, message: 'OK', db: 'connected' });
  } catch (dbErr) {
    return res.status(503).json({
      success: false,
      message: '数据库连接失败',
      error: dbErr.message,
    });
  }
});

// 7. 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

// 8. Error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  const isDbError = err.code && (
    err.code.startsWith('ER_') ||
    ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'PROTOCOL_CONNECTION_LOST'].includes(err.code)
  );
  res.status(500).json({
    success: false,
    message: isDbError ? '数据库错误: ' + err.message : '服务器错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

module.exports = app;
