const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuthMw, optionalAuthMw } = require('../middleware/auth');

// POST /api/articles/:slug/like
router.post('/articles/:slug/like', requireAuthMw, async (req, res) => {
  const articleSlug = req.params.slug;
  const user = req.user;

  try {
    const [articles] = await pool.execute(
      'SELECT id FROM articles WHERE slug = ? AND status = ?',
      [articleSlug, 'published']
    );
    if (articles.length === 0) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    const articleId = articles[0].id;

    const [existing] = await pool.execute(
      'SELECT id FROM article_likes WHERE article_id = ? AND user_id = ?',
      [articleId, user.id]
    );

    if (existing.length > 0) {
      await pool.execute('DELETE FROM article_likes WHERE article_id = ? AND user_id = ?', [articleId, user.id]);
    } else {
      await pool.execute('INSERT INTO article_likes (article_id, user_id) VALUES (?, ?)', [articleId, user.id]);
    }

    const [count] = await pool.execute(
      'SELECT COUNT(*) as likes FROM article_likes WHERE article_id = ?',
      [articleId]
    );

    return res.status(200).json({
      success: true,
      data: { liked: existing.length === 0, likes: count[0].likes },
    });
  } catch (error) {
    console.error('点赞操作失败:', error);
    return res.status(500).json({ success: false, message: '操作失败' });
  }
});

// GET /api/articles/:slug/like
router.get('/articles/:slug/like', optionalAuthMw, async (req, res) => {
  const articleSlug = req.params.slug;
  const user = req.user;

  try {
    const [articles] = await pool.execute(
      'SELECT id FROM articles WHERE slug = ? AND status = ?',
      [articleSlug, 'published']
    );
    if (articles.length === 0) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    const articleId = articles[0].id;

    const [count] = await pool.execute(
      'SELECT COUNT(*) as likes FROM article_likes WHERE article_id = ?',
      [articleId]
    );

    let liked = false;
    if (user) {
      const [rows] = await pool.execute(
        'SELECT id FROM article_likes WHERE article_id = ? AND user_id = ?',
        [articleId, user.id]
      );
      liked = rows.length > 0;
    }

    return res.status(200).json({ success: true, data: { likes: count[0].likes, liked } });
  } catch (error) {
    console.error('获取点赞数失败:', error);
    return res.status(500).json({ success: false, message: '获取失败' });
  }
});

// POST /api/comments/:id/like
router.post('/comments/:id/like', requireAuthMw, async (req, res) => {
  const commentId = parseInt(req.params.id);
  const user = req.user;

  try {
    const [comments] = await pool.execute(
      'SELECT id FROM comments WHERE id = ? AND is_deleted = 0',
      [commentId]
    );
    if (comments.length === 0) {
      return res.status(404).json({ success: false, message: '评论不存在' });
    }

    const [existing] = await pool.execute(
      'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
      [commentId, user.id]
    );

    if (existing.length > 0) {
      await pool.execute('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?', [commentId, user.id]);
    } else {
      await pool.execute('INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)', [commentId, user.id]);
    }

    const [count] = await pool.execute(
      'SELECT COUNT(*) as likes FROM comment_likes WHERE comment_id = ?',
      [commentId]
    );

    return res.status(200).json({
      success: true,
      data: { liked: existing.length === 0, likes: count[0].likes },
    });
  } catch (error) {
    console.error('点赞操作失败:', error);
    return res.status(500).json({ success: false, message: '操作失败' });
  }
});

// POST /api/articles/:slug/bookmark
router.post('/articles/:slug/bookmark', requireAuthMw, async (req, res) => {
  const articleSlug = req.params.slug;
  const user = req.user;

  try {
    const [articles] = await pool.execute(
      'SELECT id FROM articles WHERE slug = ? AND status = ?',
      [articleSlug, 'published']
    );
    if (articles.length === 0) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    const articleId = articles[0].id;

    const [existing] = await pool.execute(
      'SELECT id FROM bookmarks WHERE article_id = ? AND user_id = ?',
      [articleId, user.id]
    );

    if (existing.length > 0) {
      await pool.execute('DELETE FROM bookmarks WHERE article_id = ? AND user_id = ?', [articleId, user.id]);
    } else {
      await pool.execute('INSERT INTO bookmarks (article_id, user_id) VALUES (?, ?)', [articleId, user.id]);
    }

    return res.status(200).json({
      success: true,
      data: { bookmarked: existing.length === 0 },
    });
  } catch (error) {
    console.error('收藏操作失败:', error);
    return res.status(500).json({ success: false, message: '操作失败' });
  }
});

// GET /api/user/bookmarks
router.get('/user/bookmarks', requireAuthMw, async (req, res) => {
  const user = req.user;

  try {
    const [rows] = await pool.execute(
      `SELECT a.id, a.title, a.slug, a.summary, a.cover_image, a.tags,
              a.view_count, a.created_at, b.created_at as bookmarked_at
       FROM bookmarks b
       JOIN articles a ON b.article_id = a.id
       WHERE b.user_id = ? AND a.status = 'published'
       ORDER BY b.created_at DESC`,
      [user.id]
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    return res.status(500).json({ success: false, message: '获取收藏列表失败' });
  }
});

// GET /api/articles/:slug/bookmark
router.get('/articles/:slug/bookmark', optionalAuthMw, async (req, res) => {
  const articleSlug = req.params.slug;
  const user = req.user;

  try {
    const [articles] = await pool.execute(
      'SELECT id FROM articles WHERE slug = ? AND status = ?',
      [articleSlug, 'published']
    );
    if (articles.length === 0) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    const articleId = articles[0].id;

    const [count] = await pool.execute(
      'SELECT COUNT(*) as count FROM bookmarks WHERE article_id = ?',
      [articleId]
    );

    let bookmarked = false;
    if (user) {
      const [rows] = await pool.execute(
        'SELECT id FROM bookmarks WHERE article_id = ? AND user_id = ?',
        [articleId, user.id]
      );
      bookmarked = rows.length > 0;
    }

    return res.status(200).json({ success: true, data: { bookmarks: count[0].count, bookmarked } });
  } catch (error) {
    console.error('获取收藏数失败:', error);
    return res.status(500).json({ success: false, message: '获取失败' });
  }
});

module.exports = router;
