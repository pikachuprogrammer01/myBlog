const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /
router.get('/', async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT c.*, COUNT(a.id) as article_count
     FROM categories c
     LEFT JOIN articles a ON c.id = a.category_id AND a.status = 'published'
     GROUP BY c.id`
  );
  return res.status(200).json({ success: true, data: rows });
});

// GET /:slug/articles
router.get('/:slug/articles', async (req, res) => {
  const slug = req.params.slug;
  const [rows] = await pool.execute(
    `SELECT a.id, a.title, a.slug, a.summary, a.cover_image,
            a.tags, a.view_count, a.created_at,
            c.name as category_name
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE c.slug = ? AND a.status = 'published'
     ORDER BY a.created_at DESC`,
    [slug]
  );

  return res.status(200).json({ success: true, data: rows });
});

module.exports = router;
