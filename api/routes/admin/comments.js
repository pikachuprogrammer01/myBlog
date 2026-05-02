const express = require('express');
const router = express.Router();
const pool = require('../../db');
const { requireAdminMw } = require('../../middleware/auth');

router.use(requireAdminMw);

// GET / — list all comments
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const rawLimit = parseInt(req.query.limit) || 20;
    const limit = Math.min(100, Math.max(1, rawLimit));
    const offset = Math.max(0, (page - 1) * limit);

    const [rows] = await pool.execute(
      `SELECT c.id, c.article_id, c.parent_id, c.content, c.is_sticky, c.is_deleted,
              c.created_at, c.updated_at,
              COALESCE(u.id, 0) as user_id, COALESCE(u.username, '(未知用户)') as username, COALESCE(u.role, 'user') as user_role,
              COALESCE(a.title, '(已删除)') as article_title, a.slug as article_slug
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN articles a ON c.article_id = a.id
       WHERE c.is_deleted = 0
       ORDER BY c.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`
    );

    const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM comments WHERE is_deleted = 0');

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
    console.error('获取评论列表失败:', error);
    return res.status(500).json({ success: false, message: '获取评论列表失败' });
  }
});

// DELETE / — clear all comments (soft delete)
router.delete('/', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'UPDATE comments SET is_deleted = 1 WHERE is_deleted = 0'
    );
    return res.status(200).json({
      success: true,
      message: '所有评论已清空',
      data: { deletedCount: result.affectedRows },
    });
  } catch (error) {
    console.error('清空评论失败:', error);
    return res.status(500).json({ success: false, message: '清空评论失败' });
  }
});

// POST /batch-delete — batch soft delete
router.post('/batch-delete', async (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: '请提供要删除的评论 ID 列表' });
  }

  const numericIds = ids.map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (numericIds.length === 0) {
    return res.status(400).json({ success: false, message: '无效的评论 ID' });
  }

  try {
    const placeholders = numericIds.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE comments SET is_deleted = 1 WHERE id IN (${placeholders})`,
      numericIds
    );
    return res.status(200).json({
      success: true,
      message: `已删除 ${result.affectedRows} 条评论`,
      data: { deletedCount: result.affectedRows },
    });
  } catch (error) {
    console.error('批量删除评论失败:', error);
    return res.status(500).json({ success: false, message: '批量删除评论失败' });
  }
});

module.exports = router;
