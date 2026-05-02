const { requireAdmin } = require('../middleware/auth');
const pool = require('../db');

// ========== Multipart 解析器 ==========

async function parseRawBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

function parseMultipart(buffer, contentType) {
  const boundaryMatch = contentType.match(/boundary=(.+?)(;|$)/);
  if (!boundaryMatch) throw new Error('无法解析表单数据：缺少 boundary');
  const boundary = boundaryMatch[1].trim();
  const boundaryDelimiter = `--${boundary}`;
  const endDelimiter = `--${boundary}--`;

  const parts = buffer.toString('binary').split(boundaryDelimiter);
  const files = {};
  const fields = {};

  for (const part of parts) {
    if (part === '--' || part === endDelimiter || part.trim() === '') continue;

    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;

    const headerSection = part.substring(0, headerEnd);
    const bodyStart = headerEnd + 4;
    let body = part.substring(bodyStart);
    // Strip trailing \r\n before next boundary
    if (body.endsWith('\r\n')) body = body.substring(0, body.length - 2);

    const nameMatch = headerSection.match(/name="([^"]+)"/);
    const filenameMatch = headerSection.match(/filename="([^"]+)"/);
    const ctMatch = headerSection.match(/Content-Type:\s*(\S+)/i);

    if (filenameMatch) {
      const filename = filenameMatch[1];
      const fieldName = nameMatch ? nameMatch[1] : 'file';
      files[fieldName] = {
        filename,
        contentType: ctMatch ? ctMatch[1] : 'application/octet-stream',
        buffer: Buffer.from(body, 'binary'),
      };
    } else if (nameMatch) {
      fields[nameMatch[1]] = body;
    }
  }

  return { fields, files };
}

// ========== 图片 → base64 ==========

async function convertImagesToBase64(mdContent) {
  const imgRegex = /!\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g;
  const matches = [...mdContent.matchAll(imgRegex)];
  if (matches.length === 0) return mdContent;

  const urlMap = new Map();
  for (const m of matches) {
    const url = m[2];
    if (!urlMap.has(url)) urlMap.set(url, null);
  }

  const BATCH_SIZE = 5;
  const urls = [...urlMap.keys()];
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const contentType = res.headers.get('content-type') || 'image/png';
          return `data:${contentType};base64,${buffer.toString('base64')}`;
        } finally {
          clearTimeout(timeout);
        }
      })
    );
    batch.forEach((url, idx) => {
      if (results[idx].status === 'fulfilled' && results[idx].value) {
        urlMap.set(url, results[idx].value);
      }
    });
  }

  let result = mdContent;
  for (const [url, dataUri] of urlMap) {
    if (dataUri) {
      const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escaped, 'g'), dataUri);
    }
  }
  return result;
}

// ========== 分类辅助 ==========

async function resolveCategoryId(categoryName) {
  if (!categoryName) return null;
  const [rows] = await pool.execute('SELECT id FROM categories WHERE name = ?', [categoryName]);
  if (rows.length > 0) return rows[0].id;
  const slug = categoryName
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const [result] = await pool.execute('INSERT INTO categories (name, slug) VALUES (?, ?)', [categoryName, slug]);
  return result.insertId;
}

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ========== GET /api/admin/articles ==========
async function listArticles(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const page = parseInt(searchParams.get('page')) || 1;
    const rawLimit = parseInt(searchParams.get('limit')) || 20;
    const limit = Math.min(100, Math.max(1, rawLimit));
    const offset = Math.max(0, (page - 1) * limit);
    const search = (searchParams.get('search') || '').trim();
    const status = (searchParams.get('status') || '').trim();

    let where = '';
    const params = [];

    if (search) {
      where += ' AND (a.title LIKE ? OR a.content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      where += ' AND a.status = ?';
      params.push(status);
    }

    const [rows] = await pool.execute(
      `SELECT a.id, a.title, a.slug, a.summary, a.cover_image, a.tags,
              a.status, a.view_count, a.created_at, a.updated_at,
              c.name as category_name, c.slug as category_slug
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE 1=1 ${where}
       ORDER BY a.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM articles a WHERE 1=1 ${where}`,
      params
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) },
    });
  } catch (error) {
    console.error('[Articles] 获取文章列表失败:', error);
    return res.status(500).json({ success: false, message: '获取文章列表失败' });
  }
}

// ========== GET /api/admin/articles/:id ==========
async function getArticle(req, res, id) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    const [rows] = await pool.execute(
      `SELECT a.*, c.name as category_name, c.slug as category_slug
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE a.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[Articles] 获取文章详情失败:', error);
    return res.status(500).json({ success: false, message: '获取文章详情失败' });
  }
}

// ========== POST /api/admin/articles ==========
async function createArticle(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const { title, slug, content, summary, cover_image, category_id, tags, status } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: '请输入文章标题' });
  }

  const articleSlug = (slug || slugify(title)).trim();
  const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

  try {
    const [result] = await pool.execute(
      `INSERT INTO articles (title, slug, content, summary, cover_image, category_id, tags, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), articleSlug, content || '', summary || '', cover_image || '',
       category_id || null, tagsJson, status || 'draft']
    );

    // 同步标签字典
    try {
      const { syncTagsFromArticles } = require('./tags');
      await syncTagsFromArticles();
    } catch {}

    return res.status(201).json({ success: true, data: { id: result.insertId, title: title.trim(), slug: articleSlug } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: '文章 slug 已存在，请更换标题或 slug' });
    }
    console.error('[Articles] 创建文章失败:', error);
    return res.status(500).json({ success: false, message: '创建文章失败' });
  }
}

// ========== PUT /api/admin/articles/:id ==========
async function updateArticle(req, res, id) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const { title, slug, content, summary, cover_image, category_id, tags, status } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: '请输入文章标题' });
  }

  const articleSlug = (slug || slugify(title)).trim();
  const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

  try {
    const [result] = await pool.execute(
      `UPDATE articles SET title=?, slug=?, content=?, summary=?, cover_image=?,
       category_id=?, tags=?, status=?, updated_at=NOW() WHERE id=?`,
      [title.trim(), articleSlug, content || '', summary || '', cover_image || '',
       category_id || null, tagsJson, status || 'draft', id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    // 同步标签字典
    try {
      const { syncTagsFromArticles } = require('./tags');
      await syncTagsFromArticles();
    } catch {}

    return res.status(200).json({ success: true, message: '文章已更新' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: '文章 slug 已存在' });
    }
    console.error('[Articles] 更新文章失败:', error);
    return res.status(500).json({ success: false, message: '更新文章失败' });
  }
}

// ========== DELETE /api/admin/articles/:id ==========
async function deleteArticle(req, res, id) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    const [result] = await pool.execute('DELETE FROM articles WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    return res.status(200).json({ success: true, message: '文章已删除' });
  } catch (error) {
    console.error('[Articles] 删除文章失败:', error);
    return res.status(500).json({ success: false, message: '删除文章失败' });
  }
}

// ========== POST /api/admin/articles/upload ==========
async function uploadArticleMd(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return res.status(400).json({ success: false, message: '请使用 multipart/form-data 上传文件' });
  }

  let parsed;
  try {
    const buffer = await parseRawBody(req);
    parsed = parseMultipart(buffer, contentType);
  } catch (e) {
    return res.status(400).json({ success: false, message: '文件解析失败: ' + e.message });
  }

  const file = parsed.files?.file;
  if (!file) {
    return res.status(400).json({ success: false, message: '请上传 .md 文件' });
  }

  const mdContent = file.buffer.toString('utf-8');

  // 解析 YAML frontmatter
  const matter = require('gray-matter');
  let frontmatter, bodyContent;
  try {
    const parsedMatter = matter(mdContent);
    frontmatter = parsedMatter.data;
    bodyContent = parsedMatter.content;
  } catch (e) {
    return res.status(400).json({ success: false, message: 'YAML 头部解析失败' });
  }

  const baseName = file.filename.replace(/\.md$/i, '');
  const title = frontmatter.title || baseName || '未命名文章';
  const articleSlug = frontmatter.id || frontmatter.slug || slugify(title);
  const summary = frontmatter.excerpt || frontmatter.description || bodyContent.replace(/[#*`!\[\]()\n\r]/g, '').substring(0, 150).trim();
  const coverImage = frontmatter.cover || '';

  const rawTags = frontmatter.tags || frontmatter.tag || [];
  const tags = Array.isArray(rawTags) ? rawTags : (typeof rawTags === 'string' ? rawTags.split(/[,，]/).map((s) => s.trim()).filter(Boolean) : []);
  const rawCategories = frontmatter.categories || frontmatter.category || [];
  const catNames = Array.isArray(rawCategories) ? rawCategories : [rawCategories];
  const categoryName = catNames.length > 0 ? String(catNames[0]).trim() : null;

  let categoryId = null;
  if (categoryName) {
    try {
      categoryId = await resolveCategoryId(categoryName);
    } catch {}
  }

  // 下载远程图片 → base64
  let processedContent;
  try {
    processedContent = await convertImagesToBase64(bodyContent);
  } catch {
    processedContent = bodyContent;
  }

  const tagsJson = JSON.stringify(tags);

  try {
    const [result] = await pool.execute(
      `INSERT INTO articles (title, slug, content, summary, cover_image, category_id, tags, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [title, articleSlug, processedContent, summary, coverImage, categoryId, tagsJson]
    );

    // 同步标签字典
    try {
      const { syncTagsFromArticles } = require('./tags');
      await syncTagsFromArticles();
    } catch {}

    return res.status(201).json({
      success: true,
      data: { id: result.insertId, title, slug: articleSlug },
      message: '文章已导入（草稿状态）',
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: '文章 slug 已存在，请修改后重试' });
    }
    console.error('[Articles] MD 导入失败:', error);
    return res.status(500).json({ success: false, message: '导入失败' });
  }
}

module.exports = { listArticles, getArticle, createArticle, updateArticle, deleteArticle, uploadArticleMd };
