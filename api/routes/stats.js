const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /
router.get('/', async (req, res) => {
  try {
    const [[{ total: totalArticles }]] = await pool.execute(
      'SELECT COUNT(*) as total FROM articles WHERE status = ?', ['published']
    );
    const [[{ total: totalComments }]] = await pool.execute(
      'SELECT COUNT(*) as total FROM comments WHERE is_deleted = 0'
    );
    const [[{ total: totalViews }]] = await pool.execute(
      'SELECT COALESCE(SUM(view_count), 0) as total FROM articles'
    );

    return res.status(200).json({
      success: true,
      data: {
        totalArticles: Number(totalArticles),
        totalComments: Number(totalComments),
        totalViews: Number(totalViews),
      },
    });
  } catch (error) {
    console.error('获取公开统计失败:', error);
    return res.status(500).json({ success: false, message: '获取统计失败' });
  }
});

module.exports = router;
