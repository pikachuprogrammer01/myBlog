const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET / — public article list with pagination
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const rawLimit = parseInt(req.query.limit) || 10;
  const limit = Math.min(100, Math.max(1, rawLimit));
  const offset = Math.max(0, (page - 1) * limit);

  const [rows] = await pool.execute(
    `SELECT a.id, a.title, a.slug, a.summary, a.cover_image,
            a.tags, a.view_count, a.created_at, a.updated_at,
            c.name as category_name, c.slug as category_slug
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.status = 'published'
     ORDER BY a.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`
  );

  const [countResult] = await pool.execute(
    'SELECT COUNT(*) as total FROM articles WHERE status = ?',
    ['published']
  );

  return res.status(200).json({
    success: true,
    data: rows,
    pagination: {
      page,
      limit,
      total: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / limit),
    },
  });
});

// GET /:slug — public article detail (increments view_count)
router.get('/:slug', async (req, res) => {
  const slug = req.params.slug;

  await pool.execute('UPDATE articles SET view_count = view_count + 1 WHERE slug = ?', [slug]);

  const [rows] = await pool.execute(
    `SELECT a.id, a.title, a.slug, a.content, a.summary, a.cover_image,
            a.category_id, a.tags, a.status, a.view_count, a.author_id,
            a.created_at, a.updated_at,
            c.name as category_name, c.slug as category_slug
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.slug = ? AND a.status = 'published'`,
    [slug]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: '文章不存在' });
  }

  return res.status(200).json({ success: true, data: rows[0] });
});

module.exports = router;
