const { requireAdmin } = require('../middleware/auth');
const pool = require('../db');

// GET /api/admin/users — list users with search, role filter, pagination
async function listUsers(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const rawLimit = parseInt(searchParams.get('limit')) || 20;
    const limit = Math.min(100, Math.max(1, rawLimit));
    const offset = Math.max(0, (page - 1) * limit);
    const search = (searchParams.get('search') || '').trim();
    const role = (searchParams.get('role') || '').trim();

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
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    });
  } catch (error) {
    console.error('[Users] 获取用户列表失败:', error);
    return res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
}

// GET /api/admin/users/:id
async function getUser(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

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
}

// PUT /api/admin/users/:id — update username, role, avatar_url
async function updateUser(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

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

    // Prevent removing last admin's admin role
    if (role !== undefined && targetUser.role === 'admin' && role !== 'admin') {
      const [[{ total }]] = await pool.execute(
        'SELECT COUNT(*) as total FROM users WHERE role = ?',
        ['admin']
      );
      if (Number(total) <= 1) {
        return res.status(400).json({
          success: false,
          message: '不能移除最后一位管理员的权限',
        });
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
}

// DELETE /api/admin/users/:id
async function deleteUser(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  // Cannot delete self
  if (Number(id) === admin.id) {
    return res.status(400).json({ success: false, message: '不能删除自己的账号' });
  }

  try {
    const [rows] = await pool.execute('SELECT id, role FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // Prevent deleting last admin
    if (rows[0].role === 'admin') {
      const [[{ total }]] = await pool.execute(
        'SELECT COUNT(*) as total FROM users WHERE role = ?',
        ['admin']
      );
      if (Number(total) <= 1) {
        return res.status(400).json({
          success: false,
          message: '不能删除最后一位管理员',
        });
      }
    }

    // Cascade: reassign comments to a placeholder, then delete
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
}

module.exports = { listUsers, getUser, updateUser, deleteUser };
