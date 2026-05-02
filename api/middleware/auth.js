const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'myblog-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// Express-style middleware: attaches user to req
async function authMiddleware(req, res) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  const token = header.slice(7);
  try {
    const decoded = verifyToken(token);
    const pool = require('../db');
    const [rows] = await pool.execute(
      'SELECT id, username, role, avatar_url, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );
    if (rows.length === 0) return null;
    return rows[0];
  } catch {
    return null;
  }
}

// Require auth: returns 401 if not authenticated
async function requireAuth(req, res) {
  const user = await authMiddleware(req, res);
  if (!user) {
    res.status(401).json({ success: false, message: '请先登录' });
    return null;
  }
  return user;
}

// Require admin: returns 403 if not admin
async function requireAdmin(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return null;
  if (user.role !== 'admin') {
    res.status(403).json({ success: false, message: '需要管理员权限' });
    return null;
  }
  return user;
}

// Express middleware: requires valid JWT, sets req.user or returns 401
async function requireAuthMw(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const token = header.slice(7);
  try {
    const decoded = verifyToken(token);
    const pool = require('../db');
    const [rows] = await pool.execute(
      'SELECT id, username, role, avatar_url, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    req.user = rows[0];
    return next();
  } catch {
    return res.status(401).json({ success: false, message: '令牌无效或已过期' });
  }
}

// Express middleware: requires admin role
async function requireAdminMw(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const token = header.slice(7);
  try {
    const decoded = verifyToken(token);
    const pool = require('../db');
    const [rows] = await pool.execute(
      'SELECT id, username, role, avatar_url, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    if (rows[0].role !== 'admin') {
      return res.status(403).json({ success: false, message: '需要管理员权限' });
    }
    req.user = rows[0];
    return next();
  } catch {
    return res.status(401).json({ success: false, message: '令牌无效或已过期' });
  }
}

// Express middleware: optionally attaches user to req (never fails)
async function optionalAuthMw(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = header.slice(7);
  try {
    const decoded = verifyToken(token);
    const pool = require('../db');
    const [rows] = await pool.execute(
      'SELECT id, username, role, avatar_url, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );
    req.user = rows.length > 0 ? rows[0] : null;
  } catch {
    req.user = null;
  }
  return next();
}

module.exports = { signToken, verifyToken, authMiddleware, requireAuth, requireAdmin, requireAuthMw, requireAdminMw, optionalAuthMw };
