const bcrypt = require('bcryptjs');
const { signToken, requireAuth } = require('../middleware/auth');
const pool = require('../db');

const SALT_ROUNDS = 10;

async function register(req, res) {
  const { username, password } = req.body || {};
  const name = (username || '').trim();

  if (name.length < 3 || name.length > 20) {
    return res.status(400).json({ success: false, message: '用户名长度需在 3 到 20 个字符之间' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    return res.status(400).json({ success: false, message: '用户名仅支持字母、数字和下划线' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: '密码至少需要 6 位' });
  }
  if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
    return res.status(400).json({ success: false, message: '密码需至少包含字母和数字' });
  }

  try {
    const [existing] = await pool.execute('SELECT id FROM users WHERE username = ?', [name]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: '用户名已存在' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.execute(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [name, passwordHash, 'user']
    );

    const user = {
      id: result.insertId,
      username: name,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    const token = signToken({ userId: user.id });
    return res.status(201).json({ success: true, data: { user, token } });
  } catch (error) {
    console.error('注册失败:', error);
    return res.status(500).json({ success: false, message: '注册失败，请稍后重试' });
  }
}

async function login(req, res) {
  const { username, password } = req.body || {};
  const name = (username || '').trim();

  if (!name || !password) {
    return res.status(400).json({ success: false, message: '请输入用户名和密码' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, username, password_hash, role, avatar_url, created_at FROM users WHERE username = ?',
      [name]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
    };

    const token = signToken({ userId: user.id });
    return res.status(200).json({ success: true, data: { user: safeUser, token } });
  } catch (error) {
    console.error('登录失败:', error);
    return res.status(500).json({ success: false, message: '登录失败，请稍后重试' });
  }
}

async function getProfile(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const [commentCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM comments WHERE user_id = ? AND is_deleted = 0',
      [user.id]
    );

    const [myComments] = await pool.execute(
      `SELECT c.id, c.content, c.created_at, c.parent_id,
              COALESCE(a.title, '(已删除)') as article_title, a.slug as article_slug
       FROM comments c
       LEFT JOIN articles a ON c.article_id = a.id
       WHERE c.user_id = ? AND c.is_deleted = 0
       ORDER BY c.created_at DESC
       LIMIT 50`,
      [user.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...user,
        commentCount: commentCount[0].count,
        comments: myComments,
      },
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
}

module.exports = { register, login, getProfile };
