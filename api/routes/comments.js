const { requireAuth, requireAdmin } = require('../middleware/auth');
const pool = require('../db');

// GET /api/articles/:slug/comments — 获取文章评论
async function getComments(req, res, articleSlug) {
  try {
    const [articles] = await pool.execute('SELECT id FROM articles WHERE slug = ? AND status = ?', [
      articleSlug,
      'published',
    ]);
    if (articles.length === 0) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    const articleId = articles[0].id;

    const [rows] = await pool.execute(
      `SELECT c.id, c.article_id, c.parent_id, c.content, c.is_sticky, c.is_deleted,
              c.created_at, c.updated_at,
              u.id as user_id, u.username, u.role as user_role, u.avatar_url,
              (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.article_id = ? AND c.is_deleted = 0
       ORDER BY c.is_sticky DESC, c.created_at DESC`,
      [articleId]
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('获取评论失败:', error);
    return res.status(500).json({ success: false, message: '获取评论失败' });
  }
}

// POST /api/articles/:slug/comments — 添加评论
async function addComment(req, res, articleSlug) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { content, parentId } = req.body || {};
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: '评论内容不能为空' });
  }

  try {
    const [articles] = await pool.execute('SELECT id FROM articles WHERE slug = ? AND status = ?', [
      articleSlug,
      'published',
    ]);
    if (articles.length === 0) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    const articleId = articles[0].id;

    if (parentId) {
      const [parents] = await pool.execute(
        'SELECT id FROM comments WHERE id = ? AND article_id = ? AND is_deleted = 0',
        [parentId, articleId]
      );
      if (parents.length === 0) {
        return res.status(400).json({ success: false, message: '父评论不存在' });
      }
    }

    const [result] = await pool.execute(
      'INSERT INTO comments (article_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)',
      [articleId, user.id, parentId || null, content.trim()]
    );

    const [newComment] = await pool.execute(
      `SELECT c.id, c.article_id, c.parent_id, c.content, c.is_sticky, c.is_deleted,
              c.created_at, c.updated_at,
              u.id as user_id, u.username, u.role as user_role, u.avatar_url,
              0 as likes
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, data: newComment[0] });
  } catch (error) {
    console.error('添加评论失败:', error);
    return res.status(500).json({ success: false, message: '评论发表失败' });
  }
}

// PUT /api/comments/:id — 更新评论
async function updateComment(req, res, commentId) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { content } = req.body || {};
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: '评论内容不能为空' });
  }

  try {
    const [comments] = await pool.execute('SELECT user_id FROM comments WHERE id = ?', [commentId]);
    if (comments.length === 0) {
      return res.status(404).json({ success: false, message: '评论不存在' });
    }

    if (comments[0].user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '没有权限编辑此评论' });
    }

    await pool.execute('UPDATE comments SET content = ? WHERE id = ?', [content.trim(), commentId]);

    return res.status(200).json({ success: true, message: '评论已更新' });
  } catch (error) {
    console.error('更新评论失败:', error);
    return res.status(500).json({ success: false, message: '更新评论失败' });
  }
}

// DELETE /api/comments/:id — 软删除评论
async function deleteComment(req, res, commentId) {
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const [comments] = await pool.execute('SELECT user_id FROM comments WHERE id = ?', [commentId]);
    if (comments.length === 0) {
      return res.status(404).json({ success: false, message: '评论不存在' });
    }

    if (comments[0].user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '没有权限删除此评论' });
    }

    await pool.execute('UPDATE comments SET is_deleted = 1 WHERE id = ?', [commentId]);

    return res.status(200).json({ success: true, message: '评论已删除' });
  } catch (error) {
    console.error('删除评论失败:', error);
    return res.status(500).json({ success: false, message: '删除评论失败' });
  }
}

// DELETE /api/comments/:id/permanent — 永久删除（管理员）
async function permanentDeleteComment(req, res, commentId) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    await pool.execute('DELETE FROM comments WHERE id = ?', [commentId]);
    return res.status(200).json({ success: true, message: '评论已永久删除' });
  } catch (error) {
    console.error('永久删除评论失败:', error);
    return res.status(500).json({ success: false, message: '删除评论失败' });
  }
}

// PUT /api/comments/:id/sticky — 切换置顶
async function toggleSticky(req, res, commentId) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    const [comments] = await pool.execute(
      'SELECT id, is_sticky FROM comments WHERE id = ?',
      [commentId]
    );
    if (comments.length === 0) {
      return res.status(404).json({ success: false, message: '评论不存在' });
    }

    const newSticky = comments[0].is_sticky ? 0 : 1;
    await pool.execute('UPDATE comments SET is_sticky = ? WHERE id = ?', [newSticky, commentId]);

    return res.status(200).json({ success: true, data: { sticky: !!newSticky } });
  } catch (error) {
    console.error('置顶操作失败:', error);
    return res.status(500).json({ success: false, message: '操作失败' });
  }
}

module.exports = {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  permanentDeleteComment,
  toggleSticky,
};
