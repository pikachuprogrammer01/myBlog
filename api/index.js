const pool = require('./db');
const { register, login, getProfile } = require('./routes/auth');
const {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  permanentDeleteComment,
  toggleSticky,
} = require('./routes/comments');
const {
  toggleArticleLike,
  getArticleLike,
  toggleCommentLike,
  toggleBookmark,
  getUserBookmarks,
  getBookmarkStatus,
} = require('./routes/likes');
const { submitContact, getContactMessages, markRead } = require('./routes/contact');

const ALLOWED_ORIGINS = [
  'https://pikachuprogrammer01.github.io',
  'http://localhost:5173',
  'http://localhost:3000',
];

function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

async function parseBody(req) {
  if (req.body) return req.body;
  if (req.method === 'GET' || req.method === 'HEAD') return {};

  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

module.exports = async (req, res) => {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);

  try {
    // Parse body for POST/PUT/DELETE
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      req.body = await parseBody(req);
    }

    // ============ Health Check ============
    if (pathname === '/api/health' && req.method === 'GET') {
      try {
        await pool.execute('SELECT 1');
        return res.status(200).json({ success: true, message: 'OK', db: 'connected' });
      } catch (dbErr) {
        return res.status(503).json({
          success: false,
          message: '数据库连接失败',
          error: dbErr.message,
        });
      }
    }

    // ============ Auth Routes ============
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      return await register(req, res);
    }
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      return await login(req, res);
    }
    if (pathname === '/api/auth/profile' && req.method === 'GET') {
      return await getProfile(req, res);
    }

    // ============ Article Routes ============
    if (pathname === '/api/articles' && req.method === 'GET') {
      const page = parseInt(searchParams.get('page')) || 1;
      const rawLimit = parseInt(searchParams.get('limit')) || 10;
      const limit = Math.min(100, Math.max(1, rawLimit));
      const offset = Math.max(0, (page - 1) * limit);

      // LIMIT/OFFSET 用整数插值而非占位符，避免 TiDB 预编译语句报错
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
    }

    if (pathname.match(/^\/api\/articles\/[^\/]+$/) && req.method === 'GET') {
      const slug = pathname.split('/').pop();
      await pool.execute('UPDATE articles SET view_count = view_count + 1 WHERE slug = ?', [slug]);

      const [rows] = await pool.execute(
        `SELECT a.*, c.name as category_name, c.slug as category_slug
         FROM articles a
         LEFT JOIN categories c ON a.category_id = c.id
         WHERE a.slug = ? AND a.status = 'published'`,
        [slug]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: '文章不存在' });
      }

      return res.status(200).json({ success: true, data: rows[0] });
    }

    // ============ Category Routes ============
    if (pathname === '/api/categories' && req.method === 'GET') {
      const [rows] = await pool.execute(
        `SELECT c.*, COUNT(a.id) as article_count
         FROM categories c
         LEFT JOIN articles a ON c.id = a.category_id AND a.status = 'published'
         GROUP BY c.id`
      );
      return res.status(200).json({ success: true, data: rows });
    }

    if (pathname.match(/^\/api\/categories\/[^\/]+\/articles$/) && req.method === 'GET') {
      const slug = pathname.split('/')[3];
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
    }

    // ============ Public Stats ============
    if (pathname === '/api/stats' && req.method === 'GET') {
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
    }

    // ============ Comment Routes ============
    if (pathname.match(/^\/api\/articles\/[^\/]+\/comments$/) && req.method === 'GET') {
      const articleSlug = pathname.split('/')[3];
      return await getComments(req, res, articleSlug);
    }
    if (pathname.match(/^\/api\/articles\/[^\/]+\/comments$/) && req.method === 'POST') {
      const articleSlug = pathname.split('/')[3];
      return await addComment(req, res, articleSlug);
    }
    if (pathname.match(/^\/api\/comments\/\d+$/) && req.method === 'PUT') {
      const commentId = parseInt(pathname.split('/').pop());
      return await updateComment(req, res, commentId);
    }
    if (pathname.match(/^\/api\/comments\/\d+$/) && req.method === 'DELETE') {
      const commentId = parseInt(pathname.split('/').pop());
      return await deleteComment(req, res, commentId);
    }
    if (pathname.match(/^\/api\/comments\/\d+\/permanent$/) && req.method === 'DELETE') {
      const commentId = parseInt(pathname.split('/')[3]);
      return await permanentDeleteComment(req, res, commentId);
    }
    if (pathname.match(/^\/api\/comments\/\d+\/sticky$/) && req.method === 'PUT') {
      const commentId = parseInt(pathname.split('/')[3]);
      return await toggleSticky(req, res, commentId);
    }

    // ============ Like Routes ============
    if (pathname.match(/^\/api\/articles\/[^\/]+\/like$/) && req.method === 'POST') {
      const articleSlug = pathname.split('/')[3];
      return await toggleArticleLike(req, res, articleSlug);
    }
    if (pathname.match(/^\/api\/articles\/[^\/]+\/like$/) && req.method === 'GET') {
      const articleSlug = pathname.split('/')[3];
      return await getArticleLike(req, res, articleSlug);
    }
    if (pathname.match(/^\/api\/comments\/\d+\/like$/) && req.method === 'POST') {
      const commentId = parseInt(pathname.split('/')[3]);
      return await toggleCommentLike(req, res, commentId);
    }

    // ============ Bookmark Routes ============
    if (pathname.match(/^\/api\/articles\/[^\/]+\/bookmark$/) && req.method === 'POST') {
      const articleSlug = pathname.split('/')[3];
      return await toggleBookmark(req, res, articleSlug);
    }
    if (pathname.match(/^\/api\/articles\/[^\/]+\/bookmark$/) && req.method === 'GET') {
      const articleSlug = pathname.split('/')[3];
      return await getBookmarkStatus(req, res, articleSlug);
    }
    if (pathname === '/api/user/bookmarks' && req.method === 'GET') {
      return await getUserBookmarks(req, res);
    }

    // ============ Contact Routes ============
    if (pathname === '/api/contact' && req.method === 'POST') {
      return await submitContact(req, res);
    }
    if (pathname === '/api/contact' && req.method === 'GET') {
      return await getContactMessages(req, res);
    }
    if (pathname.match(/^\/api\/contact\/\d+\/read$/) && req.method === 'PUT') {
      const messageId = parseInt(pathname.split('/')[3]);
      return await markRead(req, res, messageId);
    }

    // ============ Admin Routes ============
    if (pathname === '/api/admin/stats' && req.method === 'GET') {
      const { requireAdmin } = require('./middleware/auth');
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      try {
        const [[{ total: totalUsers }]] = await pool.execute('SELECT COUNT(*) as total FROM users');
        const [[{ total: totalComments }]] = await pool.execute('SELECT COUNT(*) as total FROM comments WHERE is_deleted = 0');
        const [[{ total: totalArticles }]] = await pool.execute('SELECT COUNT(*) as total FROM articles WHERE status = ?', ['published']);
        const [[{ total: totalViews }]] = await pool.execute('SELECT COALESCE(SUM(view_count), 0) as total FROM articles');

        return res.status(200).json({
          success: true,
          data: {
            totalArticles: Number(totalArticles),
            totalComments: Number(totalComments),
            totalUsers: Number(totalUsers),
            totalViews: Number(totalViews),
          },
        });
      } catch (error) {
        console.error('获取管理统计失败:', error);
        return res.status(500).json({ success: false, message: '获取统计失败' });
      }
    }

    if (pathname === '/api/admin/comments') {
      const { requireAdmin } = require('./middleware/auth');
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      // DELETE — 清空所有评论（软删除）
      if (req.method === 'DELETE') {
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
      }

      // GET — 获取评论列表
      if (req.method === 'GET') {
        try {
          const page = parseInt(searchParams.get('page')) || 1;
          const rawLimit = parseInt(searchParams.get('limit')) || 20;
          const limit = Math.min(100, Math.max(1, rawLimit));
          const offset = Math.max(0, (page - 1) * limit);

          const [rows] = await pool.execute(
            `SELECT c.id, c.article_id, c.parent_id, c.content, c.is_sticky, c.is_deleted,
                    c.created_at, c.updated_at,
                    u.id as user_id, u.username, u.role as user_role,
                    COALESCE(a.title, '(已删除)') as article_title, a.slug as article_slug
             FROM comments c
             JOIN users u ON c.user_id = u.id
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
      }
    }

    // ============ Admin: Reset System ============
    if (pathname === '/api/admin/reset' && req.method === 'POST') {
      const { requireAdmin } = require('./middleware/auth');
      const admin = await requireAdmin(req, res);
      if (!admin) return;

      try {
        await pool.execute('UPDATE comments SET is_deleted = 1');
        await pool.execute('DELETE FROM article_likes');
        await pool.execute('DELETE FROM comment_likes');
        await pool.execute('DELETE FROM bookmarks');
        await pool.execute('DELETE FROM contact_messages');

        return res.status(200).json({
          success: true,
          message: '系统数据已重置（用户和文章已保留）',
        });
      } catch (error) {
        console.error('重置系统数据失败:', error);
        return res.status(500).json({ success: false, message: '重置系统数据失败' });
      }
    }

    return res.status(404).json({ success: false, message: '接口不存在' });
  } catch (error) {
    console.error('API Error:', error);
    const isDbError = error.code && (
      error.code.startsWith('ER_') ||
      ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'PROTOCOL_CONNECTION_LOST'].includes(error.code)
    );
    return res.status(500).json({
      success: false,
      message: isDbError ? '数据库错误: ' + error.message : '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
