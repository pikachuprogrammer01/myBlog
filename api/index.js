const pool = require('./db');

// 允许的前端域名
const ALLOWED_ORIGINS = [
  'https://pikachuprogrammer01.github.io',  // 你的 GitHub Pages
  'http://localhost:5173',                    // Vite 本地开发
  'http://localhost:3000'                     // 其他本地端口
];

module.exports = async (req, res) => {
  const origin = req.headers.origin;

  // CORS 设置
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);

  try {
    // GET /api/articles - 文章列表
    if (pathname === '/api/articles' && req.method === 'GET') {
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 10;
      const offset = (page - 1) * limit;

      const [rows] = await pool.execute(`
                SELECT a.id, a.title, a.slug, a.summary, a.cover_image, 
                       a.tags, a.view_count, a.created_at, a.updated_at,
                       c.name as category_name, c.slug as category_slug
                FROM articles a
                LEFT JOIN categories c ON a.category_id = c.id
                WHERE a.status = 'published'
                ORDER BY a.created_at DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]);

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
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      });
    }

    // GET /api/articles/:slug - 单篇文章
    if (pathname.startsWith('/api/articles/') && req.method === 'GET') {
      const slug = pathname.split('/').pop();

      // 增加浏览量
      await pool.execute(
        'UPDATE articles SET view_count = view_count + 1 WHERE slug = ?',
        [slug]
      );

      const [rows] = await pool.execute(`
                SELECT a.*, c.name as category_name, c.slug as category_slug
                FROM articles a
                LEFT JOIN categories c ON a.category_id = c.id
                WHERE a.slug = ? AND a.status = 'published'
            `, [slug]);

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: '文章不存在' });
      }

      return res.status(200).json({ success: true, data: rows[0] });
    }

    // GET /api/categories - 分类列表
    if (pathname === '/api/categories' && req.method === 'GET') {
      const [rows] = await pool.execute(`
                SELECT c.*, COUNT(a.id) as article_count
                FROM categories c
                LEFT JOIN articles a ON c.id = a.category_id AND a.status = 'published'
                GROUP BY c.id
            `);
      return res.status(200).json({ success: true, data: rows });
    }

    // GET /api/categories/:slug/articles - 分类下的文章
    if (pathname.match(/^\/api\/categories\/[^\/]+\/articles$/) && req.method === 'GET') {
      const slug = pathname.split('/')[3];
      const [rows] = await pool.execute(`
                SELECT a.id, a.title, a.slug, a.summary, a.cover_image,
                       a.tags, a.view_count, a.created_at,
                       c.name as category_name
                FROM articles a
                LEFT JOIN categories c ON a.category_id = c.id
                WHERE c.slug = ? AND a.status = 'published'
                ORDER BY a.created_at DESC
            `, [slug]);

      return res.status(200).json({ success: true, data: rows });
    }

    return res.status(404).json({ success: false, message: '接口不存在' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};