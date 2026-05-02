const express = require('express');
const router = express.Router();
const pool = require('../../db');
const bcrypt = require('bcryptjs');
const { requireAdminMw } = require('../../middleware/auth');

router.use(requireAdminMw);

// GET / — list users with search, role filter, pagination
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const rawLimit = parseInt(req.query.limit) || 20;
    const limit = Math.min(100, Math.max(1, rawLimit));
    const offset = Math.max(0, (page - 1) * limit);
    const search = (req.query.search || '').trim();
    const role = (req.query.role || '').trim();

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND u.username LIKE ?';
      params.push(`%${search}%`);
    }
    if (role && (role === 'admin' || role === 'user')) {
      where += ' AND u.role = ?';
      params.push(role);
    }

    const countSql = `SELECT COUNT(*) as total FROM users u ${where}`;
    const dataSql = `SELECT u.id, u.username, u.role, u.avatar_url, u.created_at
                     FROM users u ${where}
                     ORDER BY u.created_at DESC
                     LIMIT ${limit} OFFSET ${offset}`;

    const [[{ total }]] = await pool.execute(countSql, params);
    const [rows] = await pool.execute(dataSql, params);

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) },
    });
  } catch (error) {
    console.error('[Users] 获取用户列表失败:', error);
    return res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const [rows] = await pool.execute(
      'SELECT id, username, role, avatar_url, created_at FROM users WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[Users] 获取用户失败:', error);
    return res.status(500).json({ success: false, message: '获取用户失败' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { username, role } = req.body || {};

  if (username !== undefined) {
    const name = (username || '').trim();
    if (name.length < 3 || name.length > 20) {
      return res.status(400).json({ success: false, message: '用户名长度需在 3 到 20 个字符之间' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      return res.status(400).json({ success: false, message: '用户名仅支持字母、数字和下划线' });
    }
    const [dup] = await pool.execute('SELECT id FROM users WHERE username = ? AND id != ?', [name, id]);
    if (dup.length > 0) {
      return res.status(409).json({ success: false, message: '用户名已存在' });
    }
  }

  try {
    const [rows] = await pool.execute('SELECT id, role FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const targetUser = rows[0];

    if (role !== undefined && targetUser.role === 'admin' && role !== 'admin') {
      const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM users WHERE role = ?', ['admin']);
      if (Number(total) <= 1) {
        return res.status(400).json({ success: false, message: '不能移除最后一位管理员的权限' });
      }
    }

    const updates = [];
    const params = [];

    if (username !== undefined) {
      updates.push('username = ?');
      params.push(username.trim());
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: '无更新字段' });
    }

    params.push(id);
    await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    return res.status(200).json({ success: true, message: '用户已更新' });
  } catch (error) {
    console.error('[Users] 更新用户失败:', error);
    return res.status(500).json({ success: false, message: '更新用户失败' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const admin = req.user;

  if (Number(id) === admin.id) {
    return res.status(400).json({ success: false, message: '不能删除自己的账号' });
  }

  try {
    const [rows] = await pool.execute('SELECT id, role FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (rows[0].role === 'admin') {
      const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM users WHERE role = ?', ['admin']);
      if (Number(total) <= 1) {
        return res.status(400).json({ success: false, message: '不能删除最后一位管理员' });
      }
    }

    await pool.execute('UPDATE comments SET user_id = 0 WHERE user_id = ?', [id]);
    await pool.execute('DELETE FROM article_likes WHERE user_id = ?', [id]);
    await pool.execute('DELETE FROM comment_likes WHERE user_id = ?', [id]);
    await pool.execute('DELETE FROM bookmarks WHERE user_id = ?', [id]);
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    return res.status(200).json({ success: true, message: '用户已删除' });
  } catch (error) {
    console.error('[Users] 删除用户失败:', error);
    return res.status(500).json({ success: false, message: '删除用户失败' });
  }
});

// POST /:id/reset-password
router.post('/:id/reset-password', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const [rows] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const passwordHash = await bcrypt.hash('123456', 10);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);

    return res.status(200).json({ success: true, message: '密码已重置为 123456' });
  } catch (error) {
    console.error('[Users] 重置密码失败:', error);
    return res.status(500).json({ success: false, message: '重置密码失败' });
  }
});

module.exports = router;
