const express = require('express');
const router = express.Router();
const pool = require('../../db');
const { requireAdminMw } = require('../../middleware/auth');

router.use(requireAdminMw);

let columnsReady = false;

async function ensureArticleColumns() {
  if (columnsReady) return;
  try {
    await pool.execute("ALTER TABLE articles MODIFY COLUMN cover_image VARCHAR(2048)");
  } catch { /* ignore ALTER errors on existing columns */ }
  try {
    await pool.execute("ALTER TABLE articles MODIFY COLUMN content MEDIUMTEXT");
  } catch { /* ignore ALTER errors on existing columns */ }
  columnsReady = true;
}

// ========== Multipart 解析器 ==========

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

// ========== 图片处理（OSS 优先，base64 兜底） ==========

const { isConfigured: isOssConfigured, mirrorImage, uploadImage } = require('../../utils/oss');

const MAX_IMAGE_BYTES = 200 * 1024;

async function mirrorImagesToOss(mdContent) {
  const imgRegex = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  const matches = [...mdContent.matchAll(imgRegex)];
  if (matches.length === 0) return mdContent;

  const urlMap = new Map();
  for (const m of matches) {
    const url = m[2];
    if (!urlMap.has(url)) urlMap.set(url, null);
  }

  const urls = [...urlMap.keys()];
  for (let i = 0; i < urls.length; i += 5) {
    const batch = urls.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map((url) => mirrorImage(url, 'images'))
    );
    batch.forEach((url, idx) => {
      if (results[idx].status === 'fulfilled' && results[idx].value) {
        urlMap.set(url, results[idx].value);
      }
    });
  }

  let result = mdContent;
  for (const [url, ossUrl] of urlMap) {
    if (ossUrl) {
      const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escaped, 'g'), ossUrl);
    }
  }
  return result;
}

async function convertImagesToBase64(mdContent) {
  const imgRegex = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  const matches = [...mdContent.matchAll(imgRegex)];
  if (matches.length === 0) return mdContent;

  const urlMap = new Map();
  for (const m of matches) {
    const url = m[2];
    if (!urlMap.has(url)) urlMap.set(url, null);
  }

  const urls = [...urlMap.keys()];
  for (let i = 0; i < urls.length; i += 5) {
    const batch = urls.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const arrayBuffer = await res.arrayBuffer();
          if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
            console.log(`[Articles] 图片过大(${(arrayBuffer.byteLength / 1024).toFixed(0)}KB)，保留原始链接: ${url}`);
            return null;
          }
          const buffer = Buffer.from(arrayBuffer);
          const contentType = res.headers.get('content-type') || 'image/png';
          return `data:${contentType};base64,${buffer.toString('base64')}`;
        } catch {
          return null;
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

async function processContentImages(mdContent) {
  if (isOssConfigured()) {
    return await mirrorImagesToOss(mdContent);
  }
  return await convertImagesToBase64(mdContent);
}

async function uploadCoverToOss(base64DataUri) {
  if (!isOssConfigured()) return null;
  const match = base64DataUri.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return null;
  try {
    const buffer = Buffer.from(match[2], 'base64');
    const contentType = match[1];
    const ext = contentType.split('/')[1] || 'png';
    return await uploadImage('cover', buffer, contentType, `cover.${ext}`);
  } catch {
    return null;
  }
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

// ========== Routes ==========

// GET /stats — per-article stats
router.get('/stats', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.id, a.title, a.slug, a.status, a.view_count, a.created_at,
              COALESCE(l.likes, 0) as likes,
              COALESCE(c.comments, 0) as comments,
              COALESCE(b.bookmarks, 0) as bookmarks
       FROM articles a
       LEFT JOIN (SELECT article_id, COUNT(*) as likes FROM article_likes GROUP BY article_id) l ON a.id = l.article_id
       LEFT JOIN (SELECT article_id, COUNT(*) as comments FROM comments WHERE is_deleted = 0 GROUP BY article_id) c ON a.id = c.article_id
       LEFT JOIN (SELECT article_id, COUNT(*) as bookmarks FROM bookmarks GROUP BY article_id) b ON a.id = b.article_id
       ORDER BY a.view_count DESC`
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('获取文章统计失败:', error);
    return res.status(500).json({ success: false, message: '获取文章统计失败' });
  }
});

// GET / — list articles with search/status pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const rawLimit = parseInt(req.query.limit) || 20;
    const limit = Math.min(100, Math.max(1, rawLimit));
    const offset = Math.max(0, (page - 1) * limit);
    const search = (req.query.search || '').trim();
    const status = (req.query.status || '').trim();

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
});

// GET /:id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const [rows] = await pool.execute(
      `SELECT a.id, a.title, a.slug, a.content, a.summary, a.cover_image,
              a.category_id, a.tags, a.status, a.view_count, a.author_id,
              a.created_at, a.updated_at,
              c.name as category_name, c.slug as category_slug
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
});

// POST /
router.post('/', async (req, res) => {
  const { title, slug, content, summary, cover_image, category_id, tags, status } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: '请输入文章标题' });
  }

  const articleSlug = (slug || slugify(title)).trim();
  const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

  try {
    await ensureArticleColumns();
    const [result] = await pool.execute(
      `INSERT INTO articles (title, slug, content, summary, cover_image, category_id, tags, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), articleSlug, content || '', summary || '', cover_image || '',
       category_id || null, tagsJson, status || 'draft']
    );

    try {
      const { syncTagsFromArticles } = require('../tags');
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
});

// PUT /:id
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, slug, content, summary, cover_image, category_id, tags, status } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: '请输入文章标题' });
  }

  const articleSlug = (slug || slugify(title)).trim();
  const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

  try {
    await ensureArticleColumns();
    const [result] = await pool.execute(
      `UPDATE articles SET title=?, slug=?, content=?, summary=?, cover_image=?,
       category_id=?, tags=?, status=?, updated_at=NOW() WHERE id=?`,
      [title.trim(), articleSlug, content || '', summary || '', cover_image || '',
       category_id || null, tagsJson, status || 'draft', id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    try {
      const { syncTagsFromArticles } = require('../tags');
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
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);

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
});

// POST /upload — MD file upload import
router.post('/upload', async (req, res) => {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return res.status(400).json({ success: false, message: '请使用 multipart/form-data 上传文件' });
  }

  let parsed;
  try {
    // req.body is a Buffer from express.raw() middleware
    parsed = parseMultipart(req.body, contentType);
  } catch (e) {
    return res.status(400).json({ success: false, message: '文件解析失败: ' + e.message });
  }

  const file = parsed.files?.file;
  if (!file) {
    return res.status(400).json({ success: false, message: '请上传 .md 文件' });
  }

  const mdContent = file.buffer.toString('utf-8');

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
    try { categoryId = await resolveCategoryId(categoryName); } catch {}
  }

  let processedContent;
  try {
    processedContent = await processContentImages(bodyContent);
  } catch {
    processedContent = bodyContent;
  }

  let coverUrl = coverImage;
  if (coverUrl && coverUrl.startsWith('data:image/')) {
    const ossCoverUrl = await uploadCoverToOss(coverUrl);
    if (ossCoverUrl) coverUrl = ossCoverUrl;
  }

  const tagsJson = JSON.stringify(tags);

  try {
    await ensureArticleColumns();
    const [result] = await pool.execute(
      `INSERT INTO articles (title, slug, content, summary, cover_image, category_id, tags, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [title, articleSlug, processedContent, summary, coverUrl, categoryId, tagsJson]
    );

    try {
      const { syncTagsFromArticles } = require('../tags');
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
});

module.exports = router;
